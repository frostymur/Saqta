from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.auth import require_roles
from backend.database import get_db
from backend.models import Station, Telemetry, User
from backend.schemas import StationCreate, StationResponse, StationUpdate
from backend.services.geo import REGION_ADMIN, locate_admin
from backend.services.station_health import station_health

router = APIRouter(prefix="/api/stations", tags=["Гидропосты"])


def _latest_telemetry(db: Session, station_id: int) -> Optional[Telemetry]:
    return (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station_id)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )


def _station_payload(station: Station, latest: Optional[Telemetry]) -> StationResponse:
    risk = None
    if latest:
        risk = "low"
        thresholds = station.thresholds or {}
        warn = float(thresholds.get("warn_level", 900))
        crit = float(thresholds.get("crit_level", 980))
        if latest.water_level >= crit:
            risk = "high"
        elif latest.water_level >= warn:
            risk = "medium"

    return StationResponse(
        id=station.id,
        name=station.name,
        code=station.code,
        region=station.region,
        lat=station.lat,
        lng=station.lng,
        hazard_type=station.hazard_type,
        status=station.status,
        health=station_health(station, latest),
        thresholds=station.thresholds,
        water_body_type=station.water_body_type or "urban",
        catchment_area_km2=station.catchment_area_km2,
        response_time_h=station.response_time_h,
        alert_radius_m=station.alert_radius_m,
        settlement=station.settlement,
        river_name=station.river_name,
        current_water_level=latest.water_level if latest else None,
        current_rate_of_rise=latest.rate_of_rise if latest else None,
        current_risk_level=risk,
        last_updated=latest.timestamp if latest else None,
    )


def _validate_location(region: str, lat: float, lng: float) -> None:
    if region not in REGION_ADMIN:
        raise HTTPException(status_code=422, detail=f"Неизвестный регион: {region}")
    admin_unit = locate_admin(lat, lng)
    if admin_unit not in REGION_ADMIN[region]:
        actual = admin_unit or "вне границ Казахстана"
        raise HTTPException(
            status_code=422,
            detail=f"Координаты не относятся к региону «{region}» (определено: {actual})",
        )


def _validate_thresholds(thresholds) -> None:
    if thresholds.warn_level >= thresholds.crit_level:
        raise HTTPException(
            status_code=422,
            detail="Предупредительный уровень должен быть ниже критического",
        )
    if thresholds.max_rate_of_rise <= 0:
        raise HTTPException(status_code=422, detail="Максимальная скорость подъёма должна быть > 0")


def _validate_profile(payload) -> None:
    if payload.catchment_area_km2 is not None and payload.catchment_area_km2 <= 0:
        raise HTTPException(status_code=422, detail="Площадь водосбора должна быть > 0")
    if payload.response_time_h is not None and not (0 < payload.response_time_h <= 72):
        raise HTTPException(status_code=422, detail="Время добегания должно быть в диапазоне (0; 72] ч")
    if payload.alert_radius_m is not None and not (100 <= payload.alert_radius_m <= 5000):
        raise HTTPException(status_code=422, detail="Радиус оповещения должен быть от 100 до 5000 м")


def _ensure_unique_code(db: Session, code: Optional[str], exclude_id: Optional[int] = None) -> None:
    if not code:
        return
    query = db.query(Station).filter(Station.code == code)
    if exclude_id is not None:
        query = query.filter(Station.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=409, detail=f"Код устройства «{code}» уже занят")


def _ensure_unique_name(db: Session, name: str, region: str, exclude_id: Optional[int] = None) -> None:
    # SQLite's lower() only folds ASCII, so compare names in Python.
    candidates = db.query(Station).filter(Station.region == region)
    if exclude_id is not None:
        candidates = candidates.filter(Station.id != exclude_id)
    wanted = name.strip().casefold()
    if any(station.name.strip().casefold() == wanted for station in candidates):
        raise HTTPException(
            status_code=409,
            detail=f"Гидропост с таким названием уже есть в регионе «{region}»",
        )


@router.get("", response_model=List[StationResponse])
def get_all_stations(
    region: Optional[str] = Query(None, description="Точное совпадение по региону"),
    db: Session = Depends(get_db),
):
    query = db.query(Station)
    if region:
        query = query.filter(Station.region == region)
    return [_station_payload(st, _latest_telemetry(db, st.id)) for st in query.all()]


@router.get("/{station_id}", response_model=StationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")
    return _station_payload(station, _latest_telemetry(db, station.id))


@router.post("", response_model=StationResponse)
def create_station(
    payload: StationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "operator"])),
):
    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Название гидропоста слишком короткое")

    _validate_location(payload.region, payload.lat, payload.lng)
    _validate_thresholds(payload.thresholds)
    _validate_profile(payload)
    _ensure_unique_name(db, name, payload.region)
    _ensure_unique_code(db, payload.code)

    station = Station(
        name=name,
        code=payload.code,
        region=payload.region,
        lat=payload.lat,
        lng=payload.lng,
        hazard_type=payload.hazard_type,
        status=payload.status,
        thresholds=payload.thresholds.model_dump(),
        water_body_type=payload.water_body_type,
        catchment_area_km2=payload.catchment_area_km2,
        response_time_h=payload.response_time_h,
        alert_radius_m=payload.alert_radius_m,
        settlement=payload.settlement,
        river_name=payload.river_name,
    )
    db.add(station)
    db.commit()
    db.refresh(station)
    return _station_payload(station, None)


@router.put("/{station_id}", response_model=StationResponse)
def update_station(
    station_id: int,
    payload: StationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "operator"])),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    name = payload.name.strip() if payload.name is not None else station.name
    region = payload.region if payload.region is not None else station.region
    lat = payload.lat if payload.lat is not None else station.lat
    lng = payload.lng if payload.lng is not None else station.lng

    if payload.region is not None or payload.lat is not None or payload.lng is not None:
        _validate_location(region, lat, lng)
    if payload.thresholds is not None:
        _validate_thresholds(payload.thresholds)
    _validate_profile(payload)
    if payload.name is not None or payload.region is not None:
        _ensure_unique_name(db, name, region, exclude_id=station.id)
    if payload.code is not None:
        _ensure_unique_code(db, payload.code, exclude_id=station.id)

    station.name = name
    if payload.code is not None:
        station.code = payload.code
    station.region = region
    station.lat = lat
    station.lng = lng
    if payload.hazard_type is not None:
        station.hazard_type = payload.hazard_type
    if payload.status is not None:
        station.status = payload.status
    if payload.thresholds is not None:
        station.thresholds = payload.thresholds.model_dump()
    if payload.water_body_type is not None:
        station.water_body_type = payload.water_body_type
    if payload.catchment_area_km2 is not None:
        station.catchment_area_km2 = payload.catchment_area_km2
    if payload.response_time_h is not None:
        station.response_time_h = payload.response_time_h
    if payload.alert_radius_m is not None:
        station.alert_radius_m = payload.alert_radius_m
    if payload.settlement is not None:
        station.settlement = payload.settlement
    if payload.river_name is not None:
        station.river_name = payload.river_name

    db.commit()
    db.refresh(station)
    return _station_payload(station, _latest_telemetry(db, station.id))
