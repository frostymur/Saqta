"""
CLI-эмулятор Arduino-датчика для проверки MQTT-приема Saqta.kz.

Пример:
    python -m backend.mqtt_mock_publisher --scenario surge --interval 3
"""
import argparse
import datetime
import json
import random
import time

import paho.mqtt.client as mqtt


def build_reading(state: dict, scenario: str) -> dict:
    if scenario == "surge":
        state["level"] += random.uniform(2.0, 4.0)
        state["rate_of_rise"] = round(random.uniform(1.5, 4.5), 1)
        state["rainfall"] = round(random.uniform(2.0, 9.0), 1)
        state["temperature"] = round(random.uniform(8.0, 14.0), 1)
        state["soil_moisture"] = round(min(96.0, state["soil_moisture"] + random.uniform(0.5, 1.5)), 1)
    else:
        state["level"] += random.uniform(-0.35, 0.35)
        state["level"] = max(700.0, min(950.0, state["level"]))
        state["rate_of_rise"] = round(random.uniform(0.0, 0.8), 1)
        state["rainfall"] = round(random.uniform(0.0, 1.5), 1)
        state["temperature"] = round(random.uniform(6.0, 12.0), 1)
        state["soil_moisture"] = round(min(90.0, max(45.0, state["soil_moisture"] + random.uniform(-0.8, 0.8))), 1)

    reading = {
        "water_level": round(state["level"], 1),
        "rate_of_rise": state["rate_of_rise"],
        "rainfall": state["rainfall"],
        "temperature": state["temperature"],
        "soil_moisture": state["soil_moisture"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    if state.get("station_code"):
        reading["station_code"] = state["station_code"]
    else:
        reading["station_id"] = state["station_id"]
    return reading


def main() -> int:
    parser = argparse.ArgumentParser(description="Mock Arduino flood sensor publisher")
    parser.add_argument("--host", default="localhost", help="MQTT broker host")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument("--station-id", type=int, default=None, help="ID гидропоста")
    parser.add_argument("--station-code", default=None, help="Код устройства (MQTT), например arduino-bridge-01")
    parser.add_argument("--prefix", default="saqta/floodwatch/sko-demo", help="MQTT namespace prefix")
    parser.add_argument("--interval", type=float, default=3.0, help="Интервал публикации, сек")
    parser.add_argument("--start-level", type=float, default=None, help="Начальный уровень, см")
    parser.add_argument("--scenario", choices=["normal", "surge"], default="normal")
    parser.add_argument("--stay-online", action="store_true", help="Не публиковать offline при выходе")
    args = parser.parse_args()

    if args.station_id is None and not args.station_code:
        args.station_id = 3

    state = {
        "station_id": args.station_id,
        "station_code": args.station_code,
        "level": args.start_level
        if args.start_level is not None
        else (930.0 if args.scenario == "surge" else 860.0),
        "soil_moisture": 80.0 if args.scenario == "surge" else 60.0,
    }

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"saqta-mock-sensor-{args.station_id}",
        protocol=mqtt.MQTTv311,
    )
    key = args.station_code or args.station_id
    topic = f"{args.prefix}/telemetry/{key}"
    status_topic = f"{args.prefix}/status/{key}"

    try:
        client.connect(args.host, args.port, keepalive=60)
    except Exception as exc:
        print(f"Не удалось подключиться к MQTT-брокеру {args.host}:{args.port}: {exc}")
        return 1

    client.loop_start()
    online = {
        "station_id": args.station_id,
        "station_code": args.station_code,
        "state": "online",
    }
    client.publish(status_topic, json.dumps(online), retain=True)
    print(f"Публикация в {topic} каждые {args.interval} с, сценарий '{args.scenario}'. Ctrl+C — выход.")
    try:
        while True:
            reading = build_reading(state, args.scenario)
            client.publish(topic, json.dumps(reading))
            print(
                f"{reading['timestamp']}  уровень={reading['water_level']} см  "
                f"подъем={reading['rate_of_rise']} см/ч  осадки={reading['rainfall']} мм/ч"
            )
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nОстановлено.")
    finally:
        if not args.stay_online:
            offline = {
                "station_id": args.station_id,
                "station_code": args.station_code,
                "state": "offline",
            }
            client.publish(status_topic, json.dumps(offline), retain=True)
            print("Опубликован статус offline (LWT-эмуляция).")
            time.sleep(0.3)
        client.loop_stop()
        client.disconnect()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
