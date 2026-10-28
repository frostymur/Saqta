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
                    full_name="Сериков Нурлан Бауржанович (Дежурный оператор ДЧС)"
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

        # 2. Список опорных гидропостов по всем регионам Казахстана
        all_stations_data = [
            # Северо-Казахстанская область (Петропавловск) — бассейн р. Есиль
            {
                "name": "Сергеевское водохранилище",
                "region": "Петропавловск (СКО)",
                "lat": 53.8824,
                "lng": 67.4111,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 800, "crit_level": 1100, "max_rate_of_rise": 15},
                "start_lvl": 740.0, "target_lvl": 945.0
            },
            {
                "name": "Гидропост с. Покровка",
                "region": "Петропавловск (СКО)",
                "lat": 54.2678,
                "lng": 68.8520,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 950, "crit_level": 1100, "max_rate_of_rise": 12},
                "start_lvl": 820.0, "target_lvl": 980.0
            },
            {
                "name": "Гидропост г. Петропавловск (Мост)",
                "region": "Петропавловск (СКО)",
                "lat": 54.8753,
                "lng": 69.1389,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 940, "crit_level": 980, "max_rate_of_rise": 10},
                "start_lvl": 790.0, "target_lvl": 962.0
            },
            {
                "name": "Пос. Заречный (Зона поймы)",
                "region": "Петропавловск (СКО)",
                "lat": 54.9120,
                "lng": 69.1650,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 880, "crit_level": 950, "max_rate_of_rise": 8},
                "start_lvl": 750.0, "target_lvl": 928.0
            },

            # г. Астана — бассейн р. Есиль
            {
                "name": "Астанинское (Вячеславское) водохранилище",
                "region": "Астана",
                "lat": 51.2180,
                "lng": 71.9560,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 700, "crit_level": 850, "max_rate_of_rise": 10},
                "start_lvl": 610.0, "target_lvl": 685.0
            },
            {
                "name": "Гидропост р. Есиль (г. Астана, Мост М-1)",
                "region": "Астана",
                "lat": 51.1605,
                "lng": 71.4280,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 450, "crit_level": 550, "max_rate_of_rise": 8},
                "start_lvl": 320.0, "target_lvl": 395.0
            },
            {
                "name": "Защитная дамба г. Астана (оз. Майбалык)",
                "region": "Астана",
                "lat": 51.0420,
                "lng": 71.4670,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 380, "crit_level": 480, "max_rate_of_rise": 6},
                "start_lvl": 260.0, "target_lvl": 310.0
            },

            # Западно-Казахстанская область (Уральск) — бассейн р. Жайык (Урал)
            {
                "name": "Гидропост г. Уральск (р. Жайык)",
                "region": "Уральск (ЗКО)",
                "lat": 51.2150,
                "lng": 51.3720,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 700, "crit_level": 850, "max_rate_of_rise": 12},
                "start_lvl": 640.0, "target_lvl": 785.0
            },
            {
                "name": "Гидропост р. Деркул (с. Белес)",
                "region": "Уральск (ЗКО)",
                "lat": 51.3120,
                "lng": 51.1540,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 600, "crit_level": 720, "max_rate_of_rise": 10},
                "start_lvl": 450.0, "target_lvl": 570.0
            },

            # Атырауская область (Атырау) — низовья р. Жайык
            {
                "name": "Гидропост г. Атырау (р. Жайык)",
                "region": "Атырау",
                "lat": 47.1160,
                "lng": 51.8830,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 500, "crit_level": 600, "max_rate_of_rise": 8},
                "start_lvl": 410.0, "target_lvl": 490.0
            },

            # Костанайская область (Костанай) — бассейн р. Тобол
            {
                "name": "Каратомарское водохранилище",
                "region": "Костанай",
                "lat": 52.9830,
                "lng": 63.1170,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 800, "crit_level": 950, "max_rate_of_rise": 12},
                "start_lvl": 690.0, "target_lvl": 830.0
            },
            {
                "name": "Гидропост г. Костанай (Большой мост)",
                "region": "Костанай",
                "lat": 53.2140,
                "lng": 63.6320,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 600, "crit_level": 750, "max_rate_of_rise": 10},
                "start_lvl": 480.0, "target_lvl": 615.0
            },

            # Актюбинская область (Актобе) — бассейн р. Илек
            {
                "name": "Актюбинское водохранилище (р. Илек)",
                "region": "Актобе",
                "lat": 50.2170,
                "lng": 57.2670,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 550, "crit_level": 680, "max_rate_of_rise": 10},
                "start_lvl": 420.0, "target_lvl": 510.0
            }
        ]

        now = datetime.datetime.now(datetime.timezone.utc)

        for s_info in all_stations_data:
            existing = db.query(Station).filter(Station.name == s_info["name"]).first()
            if not existing:
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
                db.flush()

                # Историческая телеметрия 48 часов
                start_lvl = s_info["start_lvl"]
                target_lvl = s_info["target_lvl"]
                total_hours = 48
                step = (target_lvl - start_lvl) / total_hours
                curr = start_lvl

                telemetries = []
                for h in range(total_hours, -1, -1):
                    point_time = now - datetime.timedelta(hours=h)
                    noise = random.uniform(-0.4, 0.6)
                    curr += step + noise
                    t_point = Telemetry(
                        station_id=station.id,
                        timestamp=point_time,
                        water_level=round(curr, 1),
                        rate_of_rise=round(max(0.1, step + noise * 0.4), 1),
                        rainfall=round(max(0.0, random.uniform(0.0, 2.5)), 1),
                        temperature=round(11.0 + random.uniform(-2, 3), 1),
                        soil_moisture=round(min(90.0, 55.0 + random.uniform(0, 20)), 1),
                        is_valid=True
                    )
                    telemetries.append(t_point)
                db.add_all(telemetries)

        db.commit()
        print("✓ База данных Saqta.kz успешно наполнена станциями всех ключевых регионов Казахстана.")

    except Exception as e:
        db.rollback()
        print(f"Ошибка seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
