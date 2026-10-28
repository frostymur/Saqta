from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Station, Telemetry, User, Alert
from backend.schemas import StationResponse, StationCreate, StationUpdate
from backend.auth import get_current_user, require_roles
from backend.services.ml_service import predict_flood

router = APIRouter(prefix="/api/stations", tags=["Гидропосты"])


@router.get("", response_model=List[StationResponse])
def get_all_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    results = []

    for st in stations:
        latest_tel = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == st.id)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        
        # Оцениваем текущий уровень риска
        risk = "low"
        if latest_tel:
            thresholds = st.thresholds or {}
            warn = float(thresholds.get("warn_level", 900))
            crit = float(thresholds.get("crit_level", 980))
            if latest_tel.water_level >= crit:
                risk = "high"
            elif latest_tel.water_level >= warn:
                risk = "medium"

        results.append(
            StationResponse(
                id=st.id,
                name=st.name,
                region=st.region,
                lat=st.lat,
                lng=st.lng,
                hazard_type=st.hazard_type,
                status=st.status,
                thresholds=st.thresholds,
                current_water_level=latest_tel.water_level if latest_tel else None,
                current_rate_of_rise=latest_tel.rate_of_rise if latest_tel else None,
                current_risk_level=risk,
                last_updated=latest_tel.timestamp if latest_tel else None
            )
        )
    return results


@router.get("/{station_id}", response_model=StationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    st = db.query(Station).filter(Station.id == station_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    latest_tel = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == st.id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )

    risk = "low"
    if latest_tel:
        thresholds = st.thresholds or {}
        warn = float(thresholds.get("warn_level", 900))
        crit = float(thresholds.get("crit_level", 980))
        if latest_tel.water_level >= crit:
            risk = "high"
        elif latest_tel.water_level >= warn:
            risk = "medium"

    return StationResponse(
        id=st.id,
        name=st.name,
        region=st.region,
        lat=st.lat,
        lng=st.lng,
        hazard_type=st.hazard_type,
        status=st.status,
        thresholds=st.thresholds,
        current_water_level=latest_tel.water_level if latest_tel else None,
        current_rate_of_rise=latest_tel.rate_of_rise if latest_tel else None,
        current_risk_level=risk,
        last_updated=latest_tel.timestamp if latest_tel else None
    )


@router.post("", response_model=StationResponse)
def create_station(
    payload: StationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    station = Station(
        name=payload.name,
        region=payload.region,
        lat=payload.lat,
        lng=payload.lng,
        hazard_type=payload.hazard_type,
        status=payload.status,
        thresholds=payload.thresholds.model_dump()
    )
    db.add(station)
    db.commit()
    db.refresh(station)
    return StationResponse(
        id=station.id,
        name=station.name,
        region=station.region,
        lat=station.lat,
        lng=station.lng,
        hazard_type=station.hazard_type,
        status=station.status,
        thresholds=station.thresholds
    )


@router.put("/{station_id}", response_model=StationResponse)
def update_station(
    station_id: int,
    payload: StationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "operator"]))
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    if payload.name is not None:
        station.name = payload.name
    if payload.region is not None:
        station.region = payload.region
    if payload.lat is not None:
        station.lat = payload.lat
    if payload.lng is not None:
        station.lng = payload.lng
    if payload.hazard_type is not None:
        station.hazard_type = payload.hazard_type
    if payload.status is not None:
        station.status = payload.status
    if payload.thresholds is not None:
        station.thresholds = payload.thresholds.model_dump()

    db.commit()
    db.refresh(station)

    latest_tel = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station.id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )

    return StationResponse(
        id=station.id,
        name=station.name,
        region=station.region,
        lat=station.lat,
        lng=station.lng,
        hazard_type=station.hazard_type,
        status=station.status,
        thresholds=station.thresholds,
        current_water_level=latest_tel.water_level if latest_tel else None,
        current_rate_of_rise=latest_tel.rate_of_rise if latest_tel else None,
        last_updated=latest_tel.timestamp if latest_tel else None
    )
