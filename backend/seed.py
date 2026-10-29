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

        # 2. Опорные гидропосты: малые реки и ручьи в сельской местности
        all_stations_data = [
            # Северо-Казахстанская область (Петропавловск) — бассейн р. Есиль
            {
                "name": "Ручей у с. Покровка",
                "region": "Петропавловск (СКО)",
                "lat": 54.29588,
                "lng": 68.33397,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 950, "crit_level": 1100, "max_rate_of_rise": 12},
                "start_lvl": 840.0, "target_lvl": 900.0,
                "water_body_type": "small_river",
                "catchment_area_km2": 120,
                "response_time_h": 2.5,
                "alert_radius_m": 500,
                "settlement": "с. Покровка",
                "river_name": "руч. Покровка"
            },

            # г. Астана — бассейн р. Есиль
            {
                "name": "Ручей у с. Коянды",
                "region": "Астана",
                "lat": 51.02226,
                "lng": 71.51653,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 380, "crit_level": 480, "max_rate_of_rise": 6},
                "start_lvl": 300.0, "target_lvl": 360.0,
                "water_body_type": "small_river",
                "catchment_area_km2": 90,
                "response_time_h": 2.0,
                "alert_radius_m": 500,
                "settlement": "с. Коянды",
                "river_name": "руч. Коянды"
            },

            # Западно-Казахстанская область (Уральск) — бассейн р. Деркул
            {
                "name": "Р. Деркул у с. Белес",
                "region": "Уральск (ЗКО)",
                "lat": 51.26592,
                "lng": 51.06059,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 600, "crit_level": 720, "max_rate_of_rise": 10},
                "start_lvl": 500.0, "target_lvl": 560.0,
                "water_body_type": "small_river",
                "catchment_area_km2": 140,
                "response_time_h": 3.0,
                "alert_radius_m": 500,
                "settlement": "с. Белес",
                "river_name": "р. Деркул"
            },

            # Атырауская область (Атырау) — низовья р. Жайык
            {
                "name": "Р. Жайык у с. Балыкши",
                "region": "Атырау",
                "lat": 47.07500,
                "lng": 51.86000,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 500, "crit_level": 600, "max_rate_of_rise": 8},
                "start_lvl": 400.0, "target_lvl": 460.0,
                "water_body_type": "small_river",
                "catchment_area_km2": 180,
                "response_time_h": 3.5,
                "alert_radius_m": 500,
                "settlement": "с. Балыкши",
                "river_name": "р. Жайык"
            },

            # Костанайская область (Костанай) — бассейн р. Тобол
            {
                "name": "Р. Тобол у с. Заречное",
                "region": "Костанай",
                "lat": 53.18000,
                "lng": 63.66000,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 800, "crit_level": 950, "max_rate_of_rise": 12},
                "start_lvl": 680.0, "target_lvl": 740.0,
                "water_body_type": "small_river",
                "catchment_area_km2": 220,
                "response_time_h": 4.0,
                "alert_radius_m": 500,
                "settlement": "с. Заречное",
                "river_name": "р. Тобол"
            },

            # Актюбинская область (Актобе) — бассейн р. Илек
            {
                "name": "Р. Илек у с. Акжар",
                "region": "Актобе",
                "lat": 50.26000,
                "lng": 57.33000,
                "hazard_type": "flood",
                "status": "active",
                "thresholds": {"warn_level": 550, "crit_level": 680, "max_rate_of_rise": 10},
                "start_lvl": 450.0, "target_lvl": 520.0,
                "water_body_type": "small_river",
                "catchment_area_km2": 160,
                "response_time_h": 3.0,
                "alert_radius_m": 500,
                "settlement": "с. Акжар",
                "river_name": "р. Илек"
            }
        ]

        now = datetime.datetime.utcnow()

        # Удаляем старые городские демо-станции, сохраняя устройства с кодом (Arduino).
        old_station_names = [
            "Сергеевское водохранилище",
            "Гидропост с. Покровка",
            "Гидропост г. Петропавловск (Мост)",
            "Пос. Заречный (Зона поймы)",
            "Астанинское (Вячеславское) водохранилище",
            "Гидропост р. Есиль (г. Астана, Мост М-1)",
            "Защитная дамба г. Астана (оз. Майбалык)",
            "Гидропост г. Уральск (р. Жайык)",
            "Гидропост р. Деркул (с. Белес)",
            "Гидропост г. Атырау (р. Жайык)",
            "Каратомарское водохранилище",
            "Гидропост г. Костанай (Большой мост)",
            "Актюбинское водохранилище (р. Илек)",
        ]
        old_ids = [
            station.id
            for station in db.query(Station)
            .filter(Station.name.in_(old_station_names), Station.code.is_(None))
            .all()
        ]
        if old_ids:
            db.query(Alert).filter(Alert.station_id.in_(old_ids)).delete(synchronize_session=False)
            db.query(Telemetry).filter(Telemetry.station_id.in_(old_ids)).delete(synchronize_session=False)
            db.query(Station).filter(Station.id.in_(old_ids)).delete(synchronize_session=False)
            db.flush()

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
                    thresholds=s_info["thresholds"],
                    water_body_type=s_info["water_body_type"],
                    catchment_area_km2=s_info["catchment_area_km2"],
                    response_time_h=s_info["response_time_h"],
                    alert_radius_m=s_info["alert_radius_m"],
                    settlement=s_info["settlement"],
                    river_name=s_info["river_name"]
                )
                db.add(station)
                db.flush()
            else:
                station = existing
                station.region = s_info["region"]
                station.lat = s_info["lat"]
                station.lng = s_info["lng"]
                station.thresholds = s_info["thresholds"]
                station.water_body_type = s_info["water_body_type"]
                station.catchment_area_km2 = s_info["catchment_area_km2"]
                station.response_time_h = s_info["response_time_h"]
                station.alert_radius_m = s_info["alert_radius_m"]
                station.settlement = s_info["settlement"]
                station.river_name = s_info["river_name"]

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
