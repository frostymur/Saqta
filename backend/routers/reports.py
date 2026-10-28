import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Station, Telemetry, Alert
from backend.services.weather import get_petropavlovsk_weather
from backend.services.ml_service import predict_flood

router = APIRouter(prefix="/api/reports", tags=["Оперативные сводки ДЧС"])


@router.get("/dchs-bulletin")
async def generate_dchs_bulletin(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    weather = await get_petropavlovsk_weather()
    now = datetime.datetime.utcnow()

    station_reports = []
    overall_status = "green"
    high_risk_count = 0

    for st in stations:
        records = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == st.id)
            .order_by(Telemetry.timestamp.desc())
            .limit(6)
            .all()
        )
        latest = records[0] if records else None
        
        window = [
            {
                "timestamp": t.timestamp.isoformat(),
                "water_level": t.water_level,
                "rate_of_rise": t.rate_of_rise,
                "rainfall": t.rainfall,
                "temperature": t.temperature,
                "soil_moisture": t.soil_moisture,
            }
            for t in reversed(records)
        ]
        thresholds = st.thresholds or {"warn_level": 900, "crit_level": 980}
        pred = predict_flood(window, thresholds)

        if pred["risk_level"] == "high":
            overall_status = "red"
            high_risk_count += 1
        elif pred["risk_level"] == "medium" and overall_status != "red":
            overall_status = "yellow"

        station_reports.append({
            "station_id": st.id,
            "name": st.name,
            "region": st.region,
            "water_level": latest.water_level if latest else 0.0,
            "warn_level": thresholds.get("warn_level"),
            "crit_level": thresholds.get("crit_level"),
            "rate_of_rise": latest.rate_of_rise if latest else 0.0,
            "risk_level": pred["risk_level"],
            "risk_score": pred["risk_score"],
            "forecast_1h": pred["forecast_1h"],
            "forecast_2h": pred["forecast_2h"],
            "forecast_3h": pred["forecast_3h"],
            "explanation": pred["explanation"]
        })

    active_alerts = (
        db.query(Alert)
        .filter(Alert.status == "new")
        .order_by(Alert.created_at.desc())
        .limit(10)
        .all()
    )

    bulletin = {
        "title": "ОПЕРАТИВНЫЙ ГИДРОЛОГИЧЕСКИЙ БЮЛЛЕТЕНЬ ДЧС СКО",
        "ministry": "Министерство по чрезвычайным ситуациям Республики Казахстан (МЧС РК)",
        "territory": "Северо-Казахстанская область, бассейн реки Есиль (г. Петропавловск)",
        "generated_at": now.strftime("%d.%m.%Y %H:%M UTC"),
        "overall_status": overall_status,
        "overall_status_label": (
            "КРАСНЫЙ (Чрезвычайная паводковая опасность)" if overall_status == "red"
            else ("ЖЕЛТЫЙ (Повышенная готовность)" if overall_status == "yellow" else "ЗЕЛЕНЫЙ (Штатный гидрорежим)")
        ),
        "high_risk_stations_count": high_risk_count,
        "weather_summary": weather,
        "stations": station_reports,
        "active_alerts_count": len(active_alerts),
        "evacuation_priority_zones": [
            "г. Петропавловск: пос. Заречный (ул. Первомайская, Речная)",
            "г. Петропавловск: пос. Кожевенный завод, дачные массивы р. Есиль",
            "Кызылжарский район: с. Прибрежное, с. Тепличное"
        ],
        "operational_recommendations": [
            "Привести в готовность инженерную технику (экскаваторы, самосвалы) для наращивания дамб.",
            "Развернуть пункты временного размещения (ПВР) населения с запасом питьевой воды и питания.",
            "Обеспечить постоянный радиомониторинг гребня Сергеевского водохранилища.",
            "Провести СМС-оповещение жителей пойменных микрорайонов через каналы 112."
        ]
    }
    return bulletin
