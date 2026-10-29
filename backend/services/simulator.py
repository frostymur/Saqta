import random
import datetime
import asyncio
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import Station, Telemetry
from backend.services.ml_service import predict_flood
from backend.services.alert_service import create_or_update_alert, alert_payload
from backend.services.websocket_manager import ws_manager

class FloodSimulator:
    def __init__(self):
        self.is_running = False
        self.scenario = "spring_flood_surge"  # 'normal', 'spring_flood_surge', 'dam_spillover_crit', 'heavy_rainfall'
        self.intensity = 1.0
        self.step_count = 0
        self._task = None

    def set_scenario(self, scenario: str, intensity: float = 1.0):
        self.scenario = scenario
        self.intensity = intensity

    async def execute_step(self, db: Session = None):
        own_db = False
        if db is None:
            db = SessionLocal()
            own_db = True

        try:
            stations = db.query(Station).all()
            if not stations:
                return

            self.step_count += 1
            now = datetime.datetime.utcnow()
            alert_events = []

            for station in stations:
                # Получаем последние 5 записей телеметрии
                history = (
                    db.query(Telemetry)
                    .filter(Telemetry.station_id == station.id)
                    .order_by(Telemetry.timestamp.desc())
                    .limit(5)
                    .all()
                )
                last_tel = history[0] if history else None
                curr_level = last_tel.water_level if last_tel else 700.0
                curr_rise = last_tel.rate_of_rise if last_tel else 1.0

                thresholds = station.thresholds or {"warn_level": 900, "crit_level": 980, "max_rate_of_rise": 10}
                warn_lvl = float(thresholds.get("warn_level", 900))
                crit_lvl = float(thresholds.get("crit_level", 980))

                # Динамика в зависимости от сценария
                delta = 0.0
                rainfall = 0.0
                temp = 12.0
                moisture = 65.0

                if self.scenario == "normal":
                    # Колебания вокруг нормы
                    target = warn_lvl * 0.70
                    diff = target - curr_level
                    delta = (diff * 0.05) + random.uniform(-1.0, 1.0)
                    rainfall = max(0.0, random.uniform(0.0, 1.0))
                    temp = 11.0 + random.uniform(-2, 3)
                    moisture = 55.0 + random.uniform(-3, 3)

                elif self.scenario == "spring_flood_surge":
                    # Нарастающая паводковая волна (прорыв к предупредительному и критическому уровню)
                    base_surge = 3.5 * self.intensity
                    # Эффект запаздывания волны по течению: Сергеевское -> Покровка -> Петропавловск -> Заречный
                    station_mult = 1.2 if "Сергеевское" in station.name else (1.1 if "Покровка" in station.name else 1.0)
                    delta = (base_surge * station_mult) + random.uniform(-0.5, 1.2)
                    rainfall = random.uniform(2.0, 6.0) * self.intensity
                    temp = 14.5 + random.uniform(0, 3)
                    moisture = min(92.0, 70.0 + self.step_count * 1.5)

                elif self.scenario == "dam_spillover_crit":
                    # Экстренный сброс Сергеевского водохранилища (уровень выше критического)
                    delta = random.uniform(6.0, 14.0) * self.intensity
                    rainfall = random.uniform(8.0, 18.0)
                    temp = 16.0
                    moisture = 95.0

                elif self.scenario == "heavy_rainfall":
                    rainfall = random.uniform(12.0, 25.0) * self.intensity
                    delta = random.uniform(2.0, 7.0)
                    temp = 8.0
                    moisture = 90.0

                new_level = round(max(300.0, curr_level + delta), 1)
                new_rate_of_rise = round(delta, 1)

                # Создаем новую телеметрию
                new_telemetry = Telemetry(
                    station_id=station.id,
                    timestamp=now,
                    water_level=new_level,
                    rate_of_rise=new_rate_of_rise,
                    rainfall=round(rainfall, 1),
                    temperature=round(temp, 1),
                    soil_moisture=round(moisture, 1),
                    is_valid=True
                )
                db.add(new_telemetry)
                db.flush()

                # Формируем окно для прогнозирования
                window = [
                    {
                        "timestamp": t.timestamp.isoformat(),
                        "water_level": t.water_level,
                        "rate_of_rise": t.rate_of_rise,
                        "rainfall": t.rainfall,
                        "temperature": t.temperature,
                        "soil_moisture": t.soil_moisture,
                    }
                    for t in reversed(history[:4])
                ]
                window.append({
                    "timestamp": now.isoformat(),
                    "water_level": new_level,
                    "rate_of_rise": new_rate_of_rise,
                    "rainfall": round(rainfall, 1),
                    "temperature": round(temp, 1),
                    "soil_moisture": round(moisture, 1),
                })

                # Запуск ML прогноза
                pred = predict_flood(window, thresholds)

                # Если риск средний или высокий, создаем/обновляем pending Alert
                if pred["risk_level"] in ("medium", "high"):
                    alert, event_type = create_or_update_alert(db, station, pred, now)
                    alert_events.append((event_type, alert_payload(alert)))

                # Отправляем обновление телеметрии клиентам через WebSocket
                await ws_manager.broadcast("telemetry_update", {
                    "station_id": station.id,
                    "station_name": station.name,
                    "timestamp": now.isoformat(),
                    "water_level": new_level,
                    "rate_of_rise": new_rate_of_rise,
                    "rainfall": round(rainfall, 1),
                    "temperature": round(temp, 1),
                    "soil_moisture": round(moisture, 1),
                    "risk_level": pred["risk_level"],
                    "risk_score": pred["risk_score"],
                    "forecast_1h": pred["forecast_1h"],
                    "forecast_2h": pred["forecast_2h"],
                    "forecast_3h": pred["forecast_3h"]
                })

            db.commit()

            # События оповещений рассылаем после успешного commit
            for event_type, payload in alert_events:
                await ws_manager.broadcast(event_type, payload)

        except Exception as e:
            db.rollback()
            raise e
        finally:
            if own_db:
                db.close()

    async def _run_loop(self, interval_seconds: int = 5):
        while self.is_running:
            try:
                await self.execute_step()
            except Exception as e:
                pass
            await asyncio.sleep(interval_seconds)

    def start(self, interval_seconds: int = 5):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._run_loop(interval_seconds))

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None

simulator = FloodSimulator()
