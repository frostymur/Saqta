import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Station, Telemetry, Alert
from backend.services.weather import get_petropavlovsk_weather
from backend.services.ml_service import predict_flood

router = APIRouter(prefix="/api/reports", tags=["Оперативные сводки ДЧС"])

REGION_TERRITORY = {
    "Петропавловск (СКО)": "Северо-Казахстанская область, бассейн р. Есиль (Ишим)",
    "Астана": "г. Астана и Акмолинская область, бассейн р. Есиль",
    "Уральск (ЗКО)": "Западно-Казахстанская область, бассейн р. Жайык (Урал)",
    "Атырау": "Атырауская область, дельта р. Жайык (Урал)",
    "Костанай": "Костанайская область, бассейн р. Тобол",
    "Актобе": "Актюбинская область, бассейн р. Илек",
}

RECOMMENDATIONS = {
    "red": [
        "Оповестить население пойменных районов через каналы 112 и SMS-рассылку.",
        "Привести в готовность инженерную технику для наращивания дамб и берегоукрепления.",
        "Развернуть пункты временного размещения с запасом воды и питания.",
        "Усилить круглосуточный контроль гребней водохранилищ и мостовых переходов.",
    ],
    "yellow": [
        "Проверить связь и резервное питание гидропостов в зоне риска.",
        "Привести аварийные бригады в состояние повышенной готовности.",
        "Продолжить мониторинг уровня и скорости подъёма каждые 30 минут.",
    ],
    "green": [
        "Вести штатный мониторинг уровня воды по регламенту.",
        "Проверить калибровку датчиков и полноту передачи телеметрии.",
        "Поддерживать дежурство оператора и готовность средств оповещения.",
    ],
}


@router.get("/dchs-bulletin")
async def generate_dchs_bulletin(
    region: Optional[str] = Query(
        None, description="Регион дашборда; без параметра — сводка по всем регионам"
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Station)
    if region:
        query = query.filter(Station.region == region)
    stations = query.order_by(Station.region, Station.name).all()
    if not stations:
        raise HTTPException(status_code=404, detail="Нет станций для выбранного региона")

    now = datetime.datetime.utcnow()
    fresh_since = now - datetime.timedelta(minutes=60)

    station_reports = []
    overall_status = "green"
    high_risk_count = 0
    fresh_count = 0
    latest_seen = None
    by_region = {}

    for st in stations:
        records = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == st.id)
            .order_by(Telemetry.timestamp.desc())
            .limit(6)
            .all()
        )
        latest = records[0] if records else None

        if latest:
            latest_seen = max(latest_seen, latest.timestamp) if latest_seen else latest.timestamp
            if latest.timestamp >= fresh_since:
                fresh_count += 1

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

        bucket = by_region.setdefault(
            st.region,
            {"region": st.region, "stations": 0, "high": 0, "medium": 0, "low": 0},
        )
        bucket["stations"] += 1
        bucket[pred["risk_level"]] += 1

        station_reports.append({
            "station_id": st.id,
            "name": st.name,
            "region": st.region,
            "water_level": latest.water_level if latest else 0.0,
            "warn_level": thresholds.get("warn_level"),
            "crit_level": thresholds.get("crit_level"),
            "rate_of_rise": latest.rate_of_rise if latest else 0.0,
            "last_measurement": latest.timestamp.isoformat() if latest else None,
            "risk_level": pred["risk_level"],
            "risk_score": pred["risk_score"],
            "forecast_1h": pred["forecast_1h"],
            "forecast_2h": pred["forecast_2h"],
            "forecast_3h": pred["forecast_3h"],
            "explanation": pred["explanation"]
        })

    active_alerts = (
        db.query(Alert)
        .filter(Alert.status == "pending")
        .order_by(Alert.created_at.desc())
        .limit(10)
        .all()
    )

    regions = sorted({st.region for st in stations})
    if region:
        title = f"ОПЕРАТИВНЫЙ ГИДРОЛОГИЧЕСКИЙ БЮЛЛЕТЕНЬ · {region}"
        territory = REGION_TERRITORY.get(region, region)
    else:
        title = "ОПЕРАТИВНЫЙ ГИДРОЛОГИЧЕСКИЙ БЮЛЛЕТЕНЬ ПО РЕСПУБЛИКЕ КАЗАХСТАН"
        territory = "Республика Казахстан · " + ", ".join(regions)

    # Зоны первоочередного внимания — из фактических рисков, а не статичный список.
    priority = [
        report for report in station_reports if report["risk_level"] != "low"
    ]
    evacuation_zones = [
        f"{item['region']}: {item['name']} — {item['water_level']:.0f} см "
        f"(критический {item['crit_level']} см, риск {item['risk_level']})"
        for item in sorted(priority, key=lambda item: item["risk_score"], reverse=True)
    ]

    weather = (
        await get_petropavlovsk_weather()
        if region in (None, "Петропавловск (СКО)")
        else None
    )

    return {
        "title": title,
        "ministry": "Министерство по чрезвычайным ситуациям Республики Казахстан (МЧС РК)",
        "territory": territory,
        "region": region,
        "generated_at": now.strftime("%d.%m.%Y %H:%M UTC"),
        "overall_status": overall_status,
        "overall_status_label": (
            "КРАСНЫЙ (Чрезвычайная паводковая опасность)" if overall_status == "red"
            else ("ЖЕЛТЫЙ (Повышенная готовность)" if overall_status == "yellow" else "ЗЕЛЕНЫЙ (Штатный гидрорежим)")
        ),
        "high_risk_stations_count": high_risk_count,
        "weather_summary": weather,
        "stations": station_reports,
        "by_region": sorted(by_region.values(), key=lambda item: item["region"]),
        "active_alerts_count": len(active_alerts),
        "data_freshness": {
            "source": "telemetry DB · HTTP/MQTT-приём + демо-история",
            "stations_total": len(stations),
            "stations_fresh_60m": fresh_count,
            "latest_measurement": latest_seen.isoformat() if latest_seen else None,
        },
        "evacuation_priority_zones": evacuation_zones,
        "operational_recommendations": RECOMMENDATIONS[overall_status],
    }
