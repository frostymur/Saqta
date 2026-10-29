import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from backend.database import get_db
from backend.ml.weather_client import get_hourly_precipitation_forecast
from backend.models import Station, Telemetry

router = APIRouter(prefix="/api/outlook", tags=["Прогноз уровня"])

HORIZON_HOURS = 48
LOW_CONFIDENCE_NOTE = "Низкая уверенность: эвристика по осадкам, не гидрологическая модель"


def _latest_telemetry(db: Session, station_id: int) -> Optional[Telemetry]:
    return (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station_id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )


@router.get("/{station_id}")
async def get_station_outlook(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    latest = _latest_telemetry(db, station_id)
    if latest is None:
        raise HTTPException(status_code=404, detail="Нет телеметрии для гидропоста")

    generated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    forecast = await run_in_threadpool(get_hourly_precipitation_forecast, hours=HORIZON_HOURS)

    if not forecast:
        return {
            "station_id": station_id,
            "generated_at": generated_at,
            "horizon_hours": HORIZON_HOURS,
            "confidence": "low",
            "source": "Open-Meteo 48h forecast + local water-balance heuristic",
            "summary": "Прогноз осадков Open-Meteo недоступен. Данные по уровню не рассчитаны.",
            "days": [],
        }

    thresholds = station.thresholds or {}
    warn = float(thresholds.get("warn_level", 900))
    crit = float(thresholds.get("crit_level", 980))

    soil = (latest.soil_moisture if latest.soil_moisture is not None else 50.0) / 100.0
    runoff_coefficient = 0.20 + 0.50 * soil
    level_cm = float(latest.water_level)

    # Group hourly forecast by local date (Open-Meteo returns Asia/Almaty time).
    daily: dict[str, dict] = {}
    for hour in forecast:
        time_value = str(hour.get("time") or "")
        date = time_value[:10]
        if not date:
            continue
        bucket = daily.setdefault(date, {"rainfall_mm": 0.0, "temps": []})
        bucket["rainfall_mm"] += float(hour.get("precipitation") or 0.0)
        temp = hour.get("temperature")
        if temp is not None:
            bucket["temps"].append(float(temp))

    days = []
    for date, bucket in daily.items():
        rainfall_mm = bucket["rainfall_mm"]
        temps = bucket["temps"]
        temp_c = sum(temps) / len(temps) if temps else 0.0

        level_change = rainfall_mm * runoff_coefficient * 0.45 + max(0.0, temp_c) * 0.20
        level_cm += level_change

        if level_cm >= crit:
            risk_level = "high"
        elif level_cm >= warn:
            risk_level = "medium"
        else:
            risk_level = "low"

        days.append(
            {
                "date": date,
                "rainfall_mm": round(rainfall_mm, 1),
                "temp_c": round(temp_c, 1),
                "expected_level_cm": round(level_cm, 1),
                "risk_level": risk_level,
                "note": None if risk_level == "low" else LOW_CONFIDENCE_NOTE,
            }
        )

    total_rain = sum(day["rainfall_mm"] for day in days)
    summary = (
        f"Прогноз на {HORIZON_HOURS} ч: осадки {total_rain:.1f} мм, "
        f"ожидаемый уровень {days[-1]['expected_level_cm']:.1f} см "
        f"(предупреждение {warn:.0f} см, критический {crit:.0f} см)."
        if days
        else "Прогноз осадков получен, но не содержит данных для расчёта."
    )

    return {
        "station_id": station_id,
        "generated_at": generated_at,
        "horizon_hours": HORIZON_HOURS,
        "confidence": "low",
        "source": "Open-Meteo 48h forecast + local water-balance heuristic",
        "summary": summary,
        "days": days,
    }
