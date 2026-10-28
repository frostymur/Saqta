import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Alert, Station, User
from backend.schemas import AlertResponse, AlertProcessRequest
from backend.auth import get_current_user_optional, require_roles
from backend.services.telegram import send_emergency_alert
from backend.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/alerts", tags=["Оповещения и риски"])


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = Query(None, description="Фильтр по статусу ('new', 'processed')"),
    station_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Station)
    if status:
        query = query.filter(Alert.status == status)
    if station_id:
        query = query.filter(Alert.station_id == station_id)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    result = []
    for a in alerts:
        result.append(
            AlertResponse(
                id=a.id,
                station_id=a.station_id,
                station_name=a.station.name if a.station else "Неизвестно",
                station_region=a.station.region if a.station else "СКО",
                created_at=a.created_at,
                hazard_type=a.hazard_type,
                risk_level=a.risk_level,
                risk_score=a.risk_score,
                explanation=a.explanation,
                forecast_1h=a.forecast_1h,
                forecast_2h=a.forecast_2h,
                forecast_3h=a.forecast_3h,
                status=a.status,
                processed_by=a.processed_by
            )
        )
    return result


@router.patch("/{alert_id}/process", response_model=AlertResponse)
async def process_alert(
    alert_id: int,
    payload: AlertProcessRequest = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Оповещение не найдено")

    operator_name = (
        (payload.processed_by if payload and payload.processed_by else None)
        or (current_user.full_name if current_user else "Оператор ДЧС (смена №1)")
    )

    alert.status = "processed"
    alert.processed_by = operator_name
    db.commit()
    db.refresh(alert)

    # Push update to WebSocket
    await ws_manager.broadcast("alert_processed", {
        "alert_id": alert.id,
        "status": "processed",
        "processed_by": operator_name
    })

    return AlertResponse(
        id=alert.id,
        station_id=alert.station_id,
        station_name=alert.station.name if alert.station else "Неизвестно",
        station_region=alert.station.region if alert.station else "СКО",
        created_at=alert.created_at,
        hazard_type=alert.hazard_type,
        risk_level=alert.risk_level,
        risk_score=alert.risk_score,
        explanation=alert.explanation,
        forecast_1h=alert.forecast_1h,
        forecast_2h=alert.forecast_2h,
        forecast_3h=alert.forecast_3h,
        status=alert.status,
        processed_by=alert.processed_by
    )


@router.post("/{alert_id}/send-telegram")
async def send_alert_telegram(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Оповещение не найдено")

    station = alert.station
    crit = float(station.thresholds.get("crit_level", 980)) if station and station.thresholds else 980.0

    res = await send_emergency_alert(
        station_name=station.name if station else "р. Есиль, г. Петропавловск",
        risk_level=alert.risk_level,
        water_level=alert.forecast_1h - 5.0,  # approximate current
        crit_level=crit,
        rate_of_rise=4.5,
        forecast_3h=alert.forecast_3h,
        explanation=alert.explanation
    )
    return res
