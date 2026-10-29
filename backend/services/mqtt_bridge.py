import asyncio
import datetime
import json
import logging
import math
from typing import Any, Optional

import paho.mqtt.client as mqtt

from backend.config import settings
from backend.database import SessionLocal
from backend.models import Station, Telemetry
from backend.schemas import TelemetryCreate
from backend.services.station_health import station_health
from backend.services.telemetry_ingest import ingest_telemetry
from backend.services.websocket_manager import ws_manager

logger = logging.getLogger("saqta.mqtt")

_client: Optional[mqtt.Client] = None
_loop: Optional[asyncio.AbstractEventLoop] = None


def _number(payload: dict, key: str, default: Any = None) -> Optional[float]:
    value = payload.get(key)
    if value is None:
        return default
    if isinstance(value, bool):
        raise ValueError(f"поле {key} не является числом")
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"поле {key} не является конечным числом")
    return number


def _parse_timestamp(value: Any) -> Optional[datetime.datetime]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return datetime.datetime.fromtimestamp(float(value), datetime.timezone.utc).replace(tzinfo=None)
    text = str(value).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.datetime.fromisoformat(text)
    except ValueError:
        return datetime.datetime.fromtimestamp(float(text), datetime.timezone.utc).replace(tzinfo=None)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return parsed


def _station_id_from_topic(topic: str) -> Optional[int]:
    tail = topic.rstrip("/").split("/")[-1]
    return int(tail) if tail.isdigit() else None


def _station_code_from_topic(topic: str) -> Optional[str]:
    tail = topic.rstrip("/").split("/")[-1]
    return None if tail.isdigit() else tail


def _status_topic_prefix() -> str:
    return settings.MQTT_STATUS_TOPIC.rstrip("#/")


def _build_payload(topic: str, raw: bytes) -> TelemetryCreate:
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("payload должен быть JSON-объектом")

    station_id = _station_id_from_topic(topic)
    if station_id is None:
        station_id = data.get("station_id")
    station_code = data.get("station_code") or _station_code_from_topic(topic)
    if station_id is None and not station_code:
        raise ValueError("station_id или station_code отсутствуют в топике и payload")
    if station_id is not None:
        station_id = int(station_id)
        if station_id <= 0:
            raise ValueError("station_id должен быть положительным")

    water_level = _number(data, "water_level")
    if water_level is None:
        raise ValueError("обязательное поле water_level отсутствует")
    if not 0 <= water_level <= 5000:
        raise ValueError("water_level вне диапазона 0..5000 см")

    rainfall = _number(data, "rainfall", 0.0)
    if rainfall < 0:
        raise ValueError("rainfall не может быть отрицательным")

    soil_moisture = _number(data, "soil_moisture", 50.0)
    if not 0 <= soil_moisture <= 100:
        raise ValueError("soil_moisture вне диапазона 0..100 %")

    temperature = _number(data, "temperature", 10.0)
    rate_of_rise = _number(data, "rate_of_rise")

    timestamp = _parse_timestamp(data.get("timestamp"))

    return TelemetryCreate(
        station_id=station_id,
        station_code=str(station_code) if station_code else None,
        timestamp=timestamp,
        water_level=water_level,
        rate_of_rise=rate_of_rise,
        rainfall=rainfall,
        temperature=temperature,
        soil_moisture=soil_moisture,
        is_valid=True,
    )


async def _ingest(payload: TelemetryCreate) -> None:
    db = SessionLocal()
    try:
        await ingest_telemetry(db, payload)
        logger.info(
            "MQTT: телеметрия принята (id=%s, code=%s)",
            payload.station_id, payload.station_code,
        )
    finally:
        db.close()


def _schedule_ingest(payload: TelemetryCreate) -> None:
    """Выполняется уже в event loop FastAPI, а не в сетевом потоке paho."""
    if _loop is None or _loop.is_closed():
        logger.warning("MQTT: event loop недоступен, замер станции %s отброшен", payload.station_id)
        return
    _loop.create_task(_ingest(payload))


def _on_connect(client, userdata, flags, reason_code, properties):
    if reason_code.is_failure:
        logger.warning("MQTT: не удалось подключиться к брокеру: %s", reason_code)
        return
    client.subscribe(settings.MQTT_TOPIC)
    client.subscribe(settings.MQTT_STATUS_TOPIC)
    logger.info(
        "MQTT: подключено к %s:%s, подписки %s и %s",
        settings.MQTT_HOST, settings.MQTT_PORT,
        settings.MQTT_TOPIC, settings.MQTT_STATUS_TOPIC,
    )


def _on_connect_fail(client, userdata):
    logger.warning(
        "MQTT: брокер %s:%s недоступен, повторяем подключение в фоне",
        settings.MQTT_HOST, settings.MQTT_PORT,
    )


def _on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
    logger.warning("MQTT: соединение потеряно (%s), переподключение...", reason_code)


def _build_status(topic: str, raw: bytes):
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("status payload должен быть JSON-объектом")

    station_id = data.get("station_id")
    if station_id is None:
        station_id = _station_id_from_topic(topic)
    station_code = data.get("station_code") or _station_code_from_topic(topic)
    if station_id is None and not station_code:
        raise ValueError("station_id или station_code отсутствуют")

    state = str(data.get("state", "offline")).lower()
    if state not in {"online", "offline", "error"}:
        raise ValueError(f"неизвестное состояние станции: {state}")
    return station_id, station_code, state


async def _apply_status(station_id, station_code, state: str) -> None:
    db = SessionLocal()
    try:
        station = None
        if station_id is not None:
            station = db.query(Station).filter(Station.id == int(station_id)).first()
        if station is None and station_code:
            station = db.query(Station).filter(Station.code == station_code).first()
        if station is None:
            logger.warning("MQTT status: станция не найдена (id=%s, code=%s)", station_id, station_code)
            return

        station.status = "offline" if state == "offline" else ("error" if state == "error" else "active")
        db.commit()
        latest = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == station.id)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        health = station_health(station, latest)
        await ws_manager.broadcast("station_status", {
            "station_id": station.id,
            "station_code": station.code,
            "station_name": station.name,
            "status": station.status,
            "health": health,
            "last_updated": latest.timestamp.isoformat() if latest else None,
        })
        logger.info("MQTT status: станция %s -> %s (%s)", station.name, state, health)
    except Exception as exc:
        db.rollback()
        logger.warning("MQTT status: не удалось применить состояние: %s", exc)
    finally:
        db.close()


def _schedule_status(station_id, station_code, state: str) -> None:
    if _loop is None or _loop.is_closed():
        logger.warning("MQTT status: event loop недоступен")
        return
    _loop.create_task(_apply_status(station_id, station_code, state))


def _on_message(client, userdata, message):
    if message.topic.startswith(_status_topic_prefix() + "/"):
        try:
            station_id, station_code, state = _build_status(message.topic, message.payload)
        except Exception as exc:
            logger.warning("MQTT status отклонен (topic=%s): %s", message.topic, exc)
            return
        if _loop is None or _loop.is_closed():
            return
        _loop.call_soon_threadsafe(_schedule_status, station_id, station_code, state)
        return

    try:
        payload = _build_payload(message.topic, message.payload)
    except Exception as exc:
        logger.warning("MQTT: сообщение отклонено (topic=%s): %s", message.topic, exc)
        return

    if _loop is None or _loop.is_closed():
        logger.warning("MQTT: event loop не готов, замер отброшен (topic=%s)", message.topic)
        return

    # paho вызывает callback в своем сетевом потоке; переносим ingest в основной loop,
    # иначе broadcast в WebSocket-и клиенты упадет на чужом event loop.
    _loop.call_soon_threadsafe(_schedule_ingest, payload)


def start_mqtt_bridge() -> None:
    """Запускает MQTT-клиент в фоне. Ошибки брокера не роняют приложение."""
    global _client, _loop
    if not settings.MQTT_ENABLED:
        logger.info("MQTT ingest отключен (MQTT_ENABLED=false)")
        return
    if _client is not None:
        return

    _loop = asyncio.get_running_loop()

    try:
        client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=settings.MQTT_CLIENT_ID,
            protocol=mqtt.MQTTv311,
        )
        if settings.MQTT_USERNAME:
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD or None)
        client.on_connect = _on_connect
        client.on_connect_fail = _on_connect_fail
        client.on_disconnect = _on_disconnect
        client.on_message = _on_message
        client.reconnect_delay_set(min_delay=1, max_delay=30)
        client.connect_async(settings.MQTT_HOST, settings.MQTT_PORT, keepalive=60)
        client.loop_start()
        _client = client
        logger.info(
            "MQTT ingest запущен: %s:%s, topic=%s",
            settings.MQTT_HOST, settings.MQTT_PORT, settings.MQTT_TOPIC,
        )
    except Exception as exc:
        _client = None
        logger.warning("MQTT ingest не запущен (брокер недоступен): %s", exc)


def stop_mqtt_bridge() -> None:
    global _client, _loop
    client, _client = _client, None
    _loop = None
    if client is None:
        return
    try:
        client.loop_stop()
        client.disconnect()
    except Exception as exc:
        logger.warning("MQTT: ошибка при остановке клиента: %s", exc)
