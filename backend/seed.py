import datetime
import random
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, Station, Telemetry, Alert
from backend.auth import hash_password
from backend.services.ml_service import predict_flood

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Проверяем пользователей
        admin_user = db.query(User).filter(User.email == "admin@saqta.kz").first()
        if not admin_user:
            users_to_seed = [
                User(
                    email="admin@saqta.kz",
                    password_hash=hash_password("admin123"),
                    role="admin",
                    full_name="Касымов Асет Муратович (Главный аналитик ДЧС)"
                ),
                User(
                    email="operator@saqta.kz",
                    password_hash=hash_password("oper123"),
                    role="operator",
                    full_name="Сериков Нурлан Бауржанович (Дежурный оператор)"
                ),
                User(
                    email="guest@saqta.kz",
                    password_hash=hash_password("guest123"),
                    role="guest",
                    full_name="Гражданский наблюдатель"
                )
            ]
            db.add_all(users_to_seed)
            db.commit()
            print("✓ 3 демо-пользователя успешно созданы (admin, operator, guest)")

        # 2. Проверяем гидропосты
        existing_stations = db.query(Station).count()
        if existing_stations == 0:
            stations_data = [
                {
                    "name": "Сергеевское водохранилище",
                    "region": "Петропавловск (СКО)",
                    "lat": 53.8824,
                    "lng": 67.4111,
                    "hazard_type": "flood",
                    "status": "active",
                    "thresholds": {"warn_level": 800, "crit_level": 1100, "max_rate_of_rise": 15}
                },
                {
                    "name": "Гидропост с. Покровка",
                    "region": "Петропавловск (СКО)",
                    "lat": 54.2678,
                    "lng": 68.8520,
                    "hazard_type": "flood",
                    "status": "active",
                    "thresholds": {"warn_level": 950, "crit_level": 1100, "max_rate_of_rise": 12}
                },
                {
                    "name": "Гидропост г. Петропавловск (Мост)",
                    "region": "Петропавловск (СКО)",
                    "lat": 54.8753,
                    "lng": 69.1389,
                    "hazard_type": "flood",
                    "status": "active",
                    "thresholds": {"warn_level": 940, "crit_level": 980, "max_rate_of_rise": 10}
                },
                {
                    "name": "Пос. Заречный (Зона поймы)",
                    "region": "Петропавловск (СКО)",
                    "lat": 54.9120,
                    "lng": 69.1650,
                    "hazard_type": "flood",
                    "status": "active",
                    "thresholds": {"warn_level": 880, "crit_level": 950, "max_rate_of_rise": 8}
                }
            ]

            created_stations = []
            for s_info in stations_data:
                station = Station(
                    name=s_info["name"],
                    region=s_info["region"],
                    lat=s_info["lat"],
                    lng=s_info["lng"],
                    hazard_type=s_info["hazard_type"],
                    status=s_info["status"],
                    thresholds=s_info["thresholds"]
                )
                db.add(station)
                created_stations.append(station)

            db.commit()
            print("✓ 4 гидропоста р. Есиль успешно созданы")

            # 3. Заполняем историческую телеметрию за 48 часов
            now = datetime.datetime.utcnow()
            for station in created_stations:
                thresholds = station.thresholds
                warn_lvl = thresholds["warn_level"]
                crit_lvl = thresholds["crit_level"]

                # Разная кривая подъема для станций
                if "Сергеевское" in station.name:
                    start_lvl = 710.0
                    target_lvl = 935.0  # выше гребня/warn
                elif "Покровка" in station.name:
                    start_lvl = 810.0
                    target_lvl = 980.0  # вошло в зону warn
                elif "Петропавловск (Мост)" in station.name:
                    start_lvl = 790.0
                    target_lvl = 952.0  # превысило warn 940 см
                else:  # Заречный
                    start_lvl = 740.0
                    target_lvl = 918.0  # превысило warn 880 см

                total_hours = 48
                step_rise = (target_lvl - start_lvl) / total_hours

                running_lvl = start_lvl
                telemetries = []
                for h in range(total_hours, -1, -1):
                    point_time = now - datetime.timedelta(hours=h)
                    noise = random.uniform(-0.6, 0.9)
                    running_lvl += step_rise + noise
                    current_rate = round(step_rise + noise * 0.5, 1)

                    rainfall = round(max(0.0, random.uniform(0.0, 4.5) if h < 24 else random.uniform(0.0, 1.2)), 1)
                    temp = round(7.0 + (total_hours - h) * 0.15 + random.uniform(-1, 2), 1)
                    soil = round(min(94.0, 58.0 + (total_hours - h) * 0.6), 1)

                    telemetry_point = Telemetry(
                        station_id=station.id,
                        timestamp=point_time,
                        water_level=round(running_lvl, 1),
                        rate_of_rise=max(0.1, current_rate),
                        rainfall=rainfall,
                        temperature=temp,
                        soil_moisture=soil,
                        is_valid=True
                    )
                    telemetries.append(telemetry_point)

                db.add_all(telemetries)
                db.flush()

                # 4. Генерируем прогноз и начальные алерты для текущего состояния
                latest_tel = telemetries[-1]
                window = [
                    {
                        "timestamp": t.timestamp.isoformat(),
                        "water_level": t.water_level,
                        "rate_of_rise": t.rate_of_rise,
                        "rainfall": t.rainfall,
                        "temperature": t.temperature,
                        "soil_moisture": t.soil_moisture,
                    }
                    for t in telemetries[-5:]
                ]
                pred = predict_flood(window, thresholds)

                if pred["risk_level"] in ("medium", "high"):
                    initial_alert = Alert(
                        station_id=station.id,
                        created_at=now,
                        hazard_type=station.hazard_type,
                        risk_level=pred["risk_level"],
                        risk_score=pred["risk_score"],
                        explanation=pred["explanation"],
                        forecast_1h=pred["forecast_1h"],
                        forecast_2h=pred["forecast_2h"],
                        forecast_3h=pred["forecast_3h"],
                        status="new"
                    )
                    db.add(initial_alert)

            db.commit()
            print("✓ Историческая телеметрия за 48 часов и оперативные алерты сгенерированы")

    except Exception as e:
        db.rollback()
        print(f"Ошибка seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
