import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Alert, Station, User
from backend.schemas import AlertResponse, AlertProcessRequest, AlertDecisionRequest
from backend.auth import require_roles
from backend.services.alert_service import alert_payload
from backend.services.telegram import send_emergency_alert
from backend.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/alerts", tags=["Оповещения и риски"])


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = Query(None, description="Фильтр по статусу ('pending', 'published', 'declined')"),
    station_id: Optional[int] = Query(None),
    region: Optional[str] = Query(None, description="Точное совпадение по региону"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["operator", "admin"]))
):
    query = db.query(Alert).join(Station)
    if status:
        query = query.filter(Alert.status == status)
    if station_id:
        query = query.filter(Alert.station_id == station_id)
    if region:
        query = query.filter(Station.region == region)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return [AlertResponse(**alert_payload(a)) for a in alerts]


@router.get("/public", response_model=List[AlertResponse])
def get_public_alerts(
    region: Optional[str] = Query(None, description="Точное совпадение по региону"),
    station_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Публичная лента для граждан: только подтвержденные оператором оповещения."""
    query = db.query(Alert).join(Station).filter(Alert.status == "published")
    if region:
        query = query.filter(Station.region == region)
    if station_id:
        query = query.filter(Alert.station_id == station_id)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return [AlertResponse(**alert_payload(a)) for a in alerts]


@router.get("/stats")
def get_alert_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["operator", "admin"]))
):
    rows = db.query(Alert, Station.region).join(Station).all()
    since_24h = datetime.datetime.utcnow() - datetime.timedelta(hours=24)

    stats = {
        "total": len(rows),
        "pending": 0,
        "published": 0,
        "declined": 0,
        "high_risk_pending": 0,
        "published_24h": 0,
        "by_region": [],
    }
    by_region = {}

    for alert, region in rows:
        if alert.status in ("pending", "published", "declined"):
            stats[alert.status] += 1
        if alert.status == "pending" and alert.risk_level == "high":
            stats["high_risk_pending"] += 1
        if alert.status == "published" and alert.created_at >= since_24h:
            stats["published_24h"] += 1

        key = region or "Неизвестно"
        entry = by_region.setdefault(key, {
            "region": key, "total": 0, "pending": 0, "published": 0, "declined": 0
        })
        entry["total"] += 1
        if alert.status in ("pending", "published", "declined"):
            entry[alert.status] += 1

    stats["by_region"] = sorted(by_region.values(), key=lambda item: item["total"], reverse=True)
    return stats


@router.get("/log", response_model=List[AlertResponse])
def get_alert_log(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["operator", "admin"]))
):
    """Журнал решений оператора: подтвержденные и отклоненные оповещения."""
    alerts = (
        db.query(Alert)
        .filter(Alert.status.in_(["published", "declined"]))
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    return [AlertResponse(**alert_payload(a)) for a in alerts]


@router.patch("/{alert_id}/decision", response_model=AlertResponse)
async def decide_alert(
    alert_id: int,
    payload: AlertDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["operator", "admin"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Оповещение не найдено")

    approved = payload.action == "approve"
    alert.status = "published" if approved else "declined"
    alert.processed_by = payload.processed_by or current_user.full_name
    db.commit()
    db.refresh(alert)

    result = AlertResponse(**alert_payload(alert))
    await ws_manager.broadcast(
        "alert_published" if approved else "alert_declined",
        result.model_dump(mode="json")
    )
    return result


@router.patch("/{alert_id}/process", response_model=AlertResponse)
async def process_alert(
    alert_id: int,
    payload: AlertProcessRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["operator", "admin"]))
):
    """Устаревший endpoint: оставлен как alias подтверждения (approve)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Оповещение не найдено")

    alert.status = "published"
    alert.processed_by = (
        (payload.processed_by if payload and payload.processed_by else None)
        or (current_user.full_name if current_user else "Оператор ДЧС (смена №1)")
    )
    db.commit()
    db.refresh(alert)

    result = AlertResponse(**alert_payload(alert))
    await ws_manager.broadcast("alert_published", result.model_dump(mode="json"))
    return result


@router.post("/{alert_id}/send-telegram")
async def send_alert_telegram(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["operator", "admin"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Оповещение не найдено")
    if alert.status != "published":
        raise HTTPException(
            status_code=409,
            detail="Отправка в Telegram разрешена только для подтвержденных оповещений"
        )

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
