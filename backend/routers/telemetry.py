import datetime
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Telemetry, Station
from backend.schemas import TelemetryResponse, TelemetryLogResponse, TelemetryCreate
from backend.services.telemetry_ingest import ingest_telemetry

router = APIRouter(prefix="/api/telemetry", tags=["Телеметрия"])

SERIES_HOURS = {"24h": 24, "7d": 168, "30d": 720}


@router.get("/log", response_model=List[TelemetryLogResponse])
def get_telemetry_log(
    station_id: Optional[int] = Query(None, description="Фильтр по гидропосту"),
    region: Optional[str] = Query(None, description="Фильтр по региону"),
    hours: int = Query(24, ge=1, le=720, description="Период в часах"),
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Журнал сырых показаний датчиков по всем гидропостам, новые сверху."""
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    query = (
        db.query(Telemetry, Station.name, Station.region)
        .join(Station, Telemetry.station_id == Station.id)
        .filter(Telemetry.timestamp >= since)
    )
    if station_id is not None:
        query = query.filter(Telemetry.station_id == station_id)
    if region:
        query = query.filter(Station.region == region)

    rows = (
        query.order_by(Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        TelemetryLogResponse.model_validate(record).model_copy(
            update={"station_name": station_name, "station_region": station_region}
        )
        for record, station_name, station_region in rows
    ]


@router.get("/{station_id}", response_model=List[TelemetryResponse])
def get_station_telemetry(
    station_id: int,
    hours: Optional[int] = Query(48, ge=1, le=720, description="Период в часах"),
    limit: Optional[int] = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    # Последние `limit` замеров за период, но в хронологическом порядке.
    telemetry_records = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station_id, Telemetry.timestamp >= since)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(telemetry_records))


@router.get("/{station_id}/series")
def get_station_series(
    station_id: int,
    range: str = Query("24h", pattern="^(24h|7d|30d)$", description="24h | 7d | 30d"),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    since = datetime.datetime.utcnow() - datetime.timedelta(hours=SERIES_HOURS[range])
    records = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station_id, Telemetry.timestamp >= since)
        .order_by(Telemetry.timestamp.asc())
        .all()
    )

    # Прореживание до <=60 точек с обязательным сохранением последнего замера
    if len(records) > 60:
        step = max(1, math.ceil((len(records) - 1) / 59))
        sampled = records[::step]
        if sampled[-1] is not records[-1]:
            sampled.append(records[-1])
        records = sampled

    points = [
        {
            "timestamp": t.timestamp,
            "water_level": t.water_level,
            "rate_of_rise": t.rate_of_rise,
            "rainfall": t.rainfall,
        }
        for t in records
    ]
    return {"range": range, "points": points}


@router.post("", response_model=TelemetryResponse)
async def push_telemetry(payload: TelemetryCreate, db: Session = Depends(get_db)):
    try:
        return await ingest_telemetry(db, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
