import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.auth import require_roles
from backend.database import get_db
from backend.models import Alert, Station, Telemetry, User
from backend.seed import seed_database

router = APIRouter(prefix="/api/demo", tags=["Демо"])


class DemoResetRequest(BaseModel):
    scope: Literal["all", "station"] = "all"
    station_id: Optional[int] = None
    station_code: Optional[str] = None
    level: float = 930.0
    hours: int = Field(24, ge=1, le=720)


@router.post("/reset")
def reset_demo(
    payload: DemoResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    """Admin-only reset used between demo rehearsals."""
    if payload.scope == "all":
        alerts = db.query(Alert).delete(synchronize_session=False)
        telemetry = db.query(Telemetry).delete(synchronize_session=False)
        db.commit()
        seed_database()
        db.query(Station).update({Station.status: "active"}, synchronize_session=False)
        db.commit()
        return {
            "scope": "all",
            "removed_alerts": alerts,
            "removed_telemetry": telemetry,
            "stations": db.query(Station).count(),
        }

    station = None
    if payload.station_id is not None:
        station = db.query(Station).filter(Station.id == payload.station_id).first()
    if station is None and payload.station_code:
        station = db.query(Station).filter(Station.code == payload.station_code).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    alerts = db.query(Alert).filter(Alert.station_id == station.id).delete(
        synchronize_session=False
    )
    now_utc = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
    since = now_utc - datetime.timedelta(hours=payload.hours)
    telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station.id, Telemetry.timestamp >= since)
        .delete(synchronize_session=False)
    )
    anchor = now_utc.replace(minute=0, second=0, microsecond=0)
    for hour in range(payload.hours, 0, -1):
        db.add(
            Telemetry(
                station_id=station.id,
                timestamp=anchor - datetime.timedelta(hours=hour),
                water_level=payload.level,
                rate_of_rise=0.0,
                rainfall=0.0,
                temperature=10.0,
                soil_moisture=60.0,
                is_valid=True,
            )
        )
    station.status = "active"
    db.commit()
    return {
        "scope": "station",
        "station_id": station.id,
        "station_name": station.name,
        "station_code": station.code,
        "removed_alerts": alerts,
        "removed_telemetry": telemetry,
        "baseline": payload.level,
    }
