import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Telemetry, Station, Alert
from backend.schemas import TelemetryResponse, TelemetryCreate
from backend.services.ml_service import predict_flood
from backend.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/telemetry", tags=["Телеметрия"])


@router.get("/{station_id}", response_model=List[TelemetryResponse])
def get_station_telemetry(
    station_id: int,
    hours: Optional[int] = Query(48, ge=1, le=168, description="Период в часах"),
    limit: Optional[int] = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    telemetry_records = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station_id, Telemetry.timestamp >= since)
        .order_by(Telemetry.timestamp.asc())
        .limit(limit)
        .all()
    )
    return telemetry_records


@router.post("", response_model=TelemetryResponse)
async def push_telemetry(payload: TelemetryCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == payload.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    timestamp = payload.timestamp or datetime.datetime.utcnow()

    # Если rate_of_rise не передан, вычисляем его от предыдущего замера
    rate_of_rise = payload.rate_of_rise
    if rate_of_rise is None or rate_of_rise == 0.0:
        prev = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == payload.station_id)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        if prev:
            diff_hours = max(0.1, (timestamp - prev.timestamp).total_seconds() / 3600.0)
            rate_of_rise = round((payload.water_level - prev.water_level) / diff_hours, 1)
        else:
            rate_of_rise = 0.0

    telemetry_entry = Telemetry(
        station_id=payload.station_id,
        timestamp=timestamp,
        water_level=payload.water_level,
        rate_of_rise=rate_of_rise,
        rainfall=payload.rainfall or 0.0,
        temperature=payload.temperature or 10.0,
        soil_moisture=payload.soil_moisture or 50.0,
        is_valid=payload.is_valid if payload.is_valid is not None else True,
        error_reason=payload.error_reason
    )
    db.add(telemetry_entry)
    db.commit()
    db.refresh(telemetry_entry)

    # Запускаем ML-анализ для сформированного окна
    recent = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == payload.station_id)
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

    # Создаем Alert при повышенном риске
    if pred["risk_level"] in ("medium", "high"):
        alert = Alert(
            station_id=station.id,
            created_at=timestamp,
            hazard_type=station.hazard_type,
            risk_level=pred["risk_level"],
            risk_score=pred["risk_score"],
            explanation=pred["explanation"],
            forecast_1h=pred["forecast_1h"],
            forecast_2h=pred["forecast_2h"],
            forecast_3h=pred["forecast_3h"],
            status="new"
        )
        db.add(alert)
        db.commit()

        await ws_manager.broadcast("new_alert", {
            "id": alert.id,
            "station_id": station.id,
            "station_name": station.name,
            "station_region": station.region,
            "created_at": alert.created_at.isoformat(),
            "risk_level": alert.risk_level,
            "risk_score": alert.risk_score,
            "explanation": alert.explanation,
            "forecast_1h": alert.forecast_1h,
            "forecast_2h": alert.forecast_2h,
            "forecast_3h": alert.forecast_3h,
            "status": alert.status
        })

    # Оповещаем фронтенд о новой телеметрии
    await ws_manager.broadcast("telemetry_update", {
        "station_id": station.id,
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
        "forecast_3h": pred["forecast_3h"]
    })

    return telemetry_entry
