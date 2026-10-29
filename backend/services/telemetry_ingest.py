import datetime
import logging
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import Telemetry, Station
from backend.schemas import TelemetryCreate
from backend.services.ml_service import predict_flood
from backend.services.alert_service import create_or_update_alert, alert_payload
from backend.services.station_health import station_health
from backend.services.websocket_manager import ws_manager

logger = logging.getLogger("saqta.telemetry_ingest")


def _naive_utc(value: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
    """Приводит timestamp к naive UTC, как хранится в БД."""
    if value is not None and value.tzinfo is not None:
        return value.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return value


async def ingest_telemetry(db: Session, payload: TelemetryCreate) -> Telemetry:
    """
    Единый путь приема телеметрии для HTTP и MQTT:
    валидация станции, расчет скорости подъема, ML-прогноз,
    создание/обновление pending-оповещения и WebSocket-рассылка.
    """
    station = None
    if payload.station_id is not None:
        station = db.query(Station).filter(Station.id == payload.station_id).first()
    if station is None and payload.station_code:
        station = db.query(Station).filter(Station.code == payload.station_code).first()
    if not station:
        raise LookupError("Гидропост не найден (проверьте station_id или station_code)")

    station_id = station.id
    station.status = "active"
    station.last_seen = datetime.datetime.utcnow()
    timestamp = _naive_utc(payload.timestamp) or datetime.datetime.utcnow()

    rate_of_rise = payload.rate_of_rise
    if rate_of_rise is None:
        prev = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == station_id, Telemetry.timestamp <= timestamp)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        if prev:
            diff_hours = max(0.1, (timestamp - prev.timestamp).total_seconds() / 3600.0)
            rate_of_rise = round((payload.water_level - prev.water_level) / diff_hours, 1)
        else:
            rate_of_rise = 0.0

    telemetry_entry = Telemetry(
        station_id=station_id,
        timestamp=timestamp,
        water_level=payload.water_level,
        rate_of_rise=rate_of_rise,
        rainfall=payload.rainfall or 0.0,
        temperature=payload.temperature if payload.temperature is not None else 10.0,
        soil_moisture=payload.soil_moisture if payload.soil_moisture is not None else 50.0,
        is_valid=payload.is_valid if payload.is_valid is not None else True,
        error_reason=payload.error_reason,
    )

    alert_event = None
    try:
        db.add(telemetry_entry)
        db.flush()

        # Окно для ML-прогноза: последние 5 замеров, включая только что принятый
        recent = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == station_id)
            .order_by(Telemetry.timestamp.desc())
            .limit(5)
            .all()
        )
        window = [
            {
                "timestamp": t.timestamp.isoformat(),
                "water_level": t.water_level,
                "rate_of_rise": t.rate_of_rise,
                "rainfall": t.rainfall,
                "temperature": t.temperature,
                "soil_moisture": t.soil_moisture,
            }
            for t in reversed(recent)
        ]
        pred = predict_flood(window, station.thresholds or {})

        if pred["risk_level"] in ("medium", "high"):
            alert, event_type = create_or_update_alert(db, station, pred, timestamp)
            alert_event = (event_type, alert_payload(alert))

        db.commit()
        db.refresh(telemetry_entry)
    except Exception:
        db.rollback()
        raise

    if alert_event:
        await ws_manager.broadcast(alert_event[0], alert_event[1])

    await ws_manager.broadcast("telemetry_update", {
        "station_id": station.id,
        "station_code": station.code,
        "station_name": station.name,
        "timestamp": telemetry_entry.timestamp.isoformat(),
        "water_level": telemetry_entry.water_level,
        "rate_of_rise": telemetry_entry.rate_of_rise,
        "rainfall": telemetry_entry.rainfall,
        "temperature": telemetry_entry.temperature,
        "soil_moisture": telemetry_entry.soil_moisture,
        "risk_level": pred["risk_level"],
        "risk_score": pred["risk_score"],
        "forecast_1h": pred["forecast_1h"],
        "forecast_2h": pred["forecast_2h"],
        "forecast_3h": pred["forecast_3h"],
        "health": station_health(station, telemetry_entry),
    })

    return telemetry_entry
