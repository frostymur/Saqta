import datetime
import random
import sys
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, Station, Telemetry, Alert
from backend.auth import hash_password
from backend.services.ml_service import predict_flood
from backend.services.alert_service import normalize_alert_statuses


def _ensure_telemetry_history(db: Session, station: Station, now: datetime.datetime, target_level: float) -> int:
    """
    Идемпотентно создает/дополняет ~30 дней почасовой истории.
    Существующие записи не удаляются: дописывается только недостающий старый участок.
    """
    thresholds = station.thresholds or {}
    warn_level = float(thresholds.get("warn_level", 900))
    base_query = db.query(Telemetry).filter(Telemetry.station_id == station.id)
    latest = base_query.order_by(Telemetry.timestamp.desc()).first()
    oldest = base_query.order_by(Telemetry.timestamp.asc()).first()

    desired_start = now - datetime.timedelta(days=30)
    start_level = warn_level * 0.7

    if latest is None:
        start_ts, end_ts = desired_start, now
        from_level, to_level = start_level, target_level
    elif oldest is None or oldest.timestamp <= desired_start + datetime.timedelta(hours=1):
        return 0
    else:
        start_ts, end_ts = desired_start, oldest.timestamp - datetime.timedelta(hours=1)
        from_level, to_level = start_level, oldest.water_level

    total_hours = int((end_ts - start_ts).total_seconds() // 3600)
    if total_hours < 1:
        return 0

    step = (to_level - from_level) / total_hours
    rows = []
    for hour in range(total_hours + 1):
        level = max(0.0, from_level + step * hour + random.uniform(-3.0, 3.0))
        rows.append(Telemetry(
            station_id=station.id,
            timestamp=start_ts + datetime.timedelta(hours=hour),
            water_level=round(level, 1),
            rate_of_rise=round(max(0.0, step + random.uniform(-0.6, 0.6)), 1),
            rainfall=round(max(0.0, random.uniform(0.0, 2.5)), 1),
            temperature=round(9.0 + random.uniform(-3.0, 4.0), 1),
            soil_moisture=round(min(92.0, max(40.0, 60.0 + (hour / total_hours) * 25 + random.uniform(-5.0, 5.0))), 1),
            is_valid=True,
        ))

    db.add_all(rows)
    return len(rows)


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
                "lat": 53.85465,
                "lng": 67.41099,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 800, "crit_level": 1100, "max_rate_of_rise": 15},
                "start_lvl": 740.0, "target_lvl": 690.0
            },
            {
                "name": "Гидропост с. Покровка",
                "region": "Петропавловск (СКО)",
                "lat": 54.29588,
                "lng": 68.33397,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 950, "crit_level": 1100, "max_rate_of_rise": 12},
                "start_lvl": 820.0, "target_lvl": 905.0
            },
            {
                "name": "Гидропост г. Петропавловск (Мост)",
                "region": "Петропавловск (СКО)",
                "lat": 54.88262,
                "lng": 69.11862,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 940, "crit_level": 980, "max_rate_of_rise": 10},
                "start_lvl": 790.0, "target_lvl": 928.0
            },
            {
                "name": "Пос. Заречный (Зона поймы)",
                "region": "Петропавловск (СКО)",
                "lat": 54.90504,
                "lng": 69.13003,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 880, "crit_level": 950, "max_rate_of_rise": 8},
                "start_lvl": 750.0, "target_lvl": 900.0
            },

            # г. Астана — бассейн р. Есиль
            {
                "name": "Астанинское (Вячеславское) водохранилище",
                "region": "Астана",
                "lat": 50.96489,
                "lng": 72.20781,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 700, "crit_level": 850, "max_rate_of_rise": 10},
                "start_lvl": 610.0, "target_lvl": 600.0
            },
            {
                "name": "Гидропост р. Есиль (г. Астана, Мост М-1)",
                "region": "Астана",
                "lat": 51.15323,
                "lng": 71.42617,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 450, "crit_level": 550, "max_rate_of_rise": 8},
                "start_lvl": 320.0, "target_lvl": 420.0
            },
            {
                "name": "Защитная дамба г. Астана (оз. Майбалык)",
                "region": "Астана",
                "lat": 51.02226,
                "lng": 71.51653,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 380, "crit_level": 480, "max_rate_of_rise": 6},
                "start_lvl": 260.0, "target_lvl": 330.0
            },

            # Западно-Казахстанская область (Уральск) — бассейн р. Жайык (Урал)
            {
                "name": "Гидропост г. Уральск (р. Жайык)",
                "region": "Уральск (ЗКО)",
                "lat": 51.21996,
                "lng": 51.39585,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 700, "crit_level": 850, "max_rate_of_rise": 12},
                "start_lvl": 640.0, "target_lvl": 640.0
            },
            {
                "name": "Гидропост р. Деркул (с. Белес)",
                "region": "Уральск (ЗКО)",
                "lat": 51.26592,
                "lng": 51.06059,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 600, "crit_level": 720, "max_rate_of_rise": 10},
                "start_lvl": 450.0, "target_lvl": 540.0
            },

            # Атырауская область (Атырау) — низовья р. Жайык
            {
                "name": "Гидропост г. Атырау (р. Жайык)",
                "region": "Атырау",
                "lat": 47.11915,
                "lng": 51.91639,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 500, "crit_level": 600, "max_rate_of_rise": 8},
                "start_lvl": 410.0, "target_lvl": 470.0
            },

            # Костанайская область (Костанай) — бассейн р. Тобол
            {
                "name": "Каратомарское водохранилище",
                "region": "Костанай",
                "lat": 52.89487,
                "lng": 63.05225,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 800, "crit_level": 950, "max_rate_of_rise": 12},
                "start_lvl": 690.0, "target_lvl": 700.0
            },
            {
                "name": "Гидропост г. Костанай (Большой мост)",
                "region": "Костанай",
                "lat": 53.20702,
                "lng": 63.64843,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 600, "crit_level": 750, "max_rate_of_rise": 10},
                "start_lvl": 480.0, "target_lvl": 560.0
            },

            # Актюбинская область (Актобе) — бассейн р. Илек
            {
                "name": "Актюбинское водохранилище (р. Илек)",
                "region": "Актобе",
                "lat": 50.14045,
                "lng": 57.32497,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 550, "crit_level": 680, "max_rate_of_rise": 10},
                "start_lvl": 420.0, "target_lvl": 480.0
            }
        ]

        now = datetime.datetime.utcnow()

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
            else:
                station = existing
                station.region = s_info["region"]
                station.lat = s_info["lat"]
                station.lng = s_info["lng"]
                station.thresholds = s_info["thresholds"]

            # История ~30 дней: для новой станции целиком, для существующей — только старый пробел
            _ensure_telemetry_history(db, station, now, s_info["target_lvl"])

        db.commit()
        normalize_alert_statuses(db)
        print("✓ База данных Saqta.kz успешно наполнена станциями всех ключевых регионов Казахстана.")

    except Exception as e:
        db.rollback()
        print(f"Ошибка seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    if "--reset" in sys.argv:
        # Demo reset: drop synthetic readings and alerts, then re-seed the calm
        # baseline. Never use this against a database with real telemetry.
        db = SessionLocal()
        db.query(Alert).delete()
        db.query(Telemetry).delete()
        db.commit()
        db.close()
        print("✓ Демо-данные очищены, база будет заполнена заново.")
    seed_database()
