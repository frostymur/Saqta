import datetime
import logging
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.models import Alert, Station

logger = logging.getLogger("saqta.alert_service")




def alert_payload(alert: Alert) -> Dict[str, Any]:
    """Единый payload оповещения для API и WebSocket."""
    station = alert.station
    return {
        "id": alert.id,
        "station_id": alert.station_id,
        "station_name": station.name if station else "Неизвестно",
        "station_region": station.region if station else "СКО",
        "station_lat": station.lat if station else None,
        "station_lng": station.lng if station else None,
        "created_at": alert.created_at,
        "hazard_type": alert.hazard_type,
        "risk_level": alert.risk_level,
        "risk_score": alert.risk_score,
        "explanation": alert.explanation,
        "forecast_1h": alert.forecast_1h,
        "forecast_2h": alert.forecast_2h,
        "forecast_3h": alert.forecast_3h,
        "status": alert.status,
        "processed_by": alert.processed_by,
    }


def create_or_update_alert(
    db: Session,
    station: Station,
    pred: Dict[str, Any],
    created_at: datetime.datetime = None,
) -> Tuple[Alert, str]:
    """
    Создает pending-оповещение либо обновляет свежее pending этой же станции.
    Возвращает (alert, event_type), где event_type — 'new_alert' или 'alert_updated'.
    """
    created_at = created_at or datetime.datetime.utcnow()

    # Одна pending-запись на станцию: обновляем её, а не плодим дубликаты.
    # created_at сдвигаем, чтобы оператор видел свежесть риска.
    existing = (
        db.query(Alert)
        .filter(Alert.station_id == station.id, Alert.status == "pending")
        .order_by(Alert.created_at.desc())
        .first()
    )

    if existing:
        existing.created_at = created_at
        existing.risk_level = pred["risk_level"]
        existing.risk_score = pred["risk_score"]
        existing.explanation = pred["explanation"]
        existing.forecast_1h = pred["forecast_1h"]
        existing.forecast_2h = pred["forecast_2h"]
        existing.forecast_3h = pred["forecast_3h"]
        db.flush()
        return existing, "alert_updated"

    alert = Alert(
        station_id=station.id,
        created_at=created_at,
        hazard_type=station.hazard_type,
        risk_level=pred["risk_level"],
        risk_score=pred["risk_score"],
        explanation=pred["explanation"],
        forecast_1h=pred["forecast_1h"],
        forecast_2h=pred["forecast_2h"],
        forecast_3h=pred["forecast_3h"],
        status="pending",
    )
    db.add(alert)
    db.flush()
    return alert, "new_alert"


def normalize_alert_statuses(db: Session) -> Dict[str, int]:
    """
    Миграция статусов и разовая чистка очереди:
    new -> pending, processed -> published, лишние pending -> declined.
    """
    migrated_new = (
        db.query(Alert)
        .filter(Alert.status == "new")
        .update({Alert.status: "pending"}, synchronize_session=False)
    )
    migrated_processed = (
        db.query(Alert)
        .filter(Alert.status == "processed")
        .update({Alert.status: "published"}, synchronize_session=False)
    )
    db.flush()

    pending = (
        db.query(Alert)
        .filter(Alert.status == "pending")
        .order_by(Alert.station_id.asc(), Alert.created_at.desc())
        .all()
    )
    seen_stations = set()
    declined = 0
    for alert in pending:
        if alert.station_id in seen_stations:
            alert.status = "declined"
            alert.processed_by = "system-dedupe"
            declined += 1
        else:
            seen_stations.add(alert.station_id)

    db.commit()
    result = {
        "migrated_new": migrated_new,
        "migrated_processed": migrated_processed,
        "deduped_declined": declined,
    }
    if any(result.values()):
        logger.info("Нормализация оповещений: %s", result)
    return result
