from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models import Station, Telemetry
from backend.schemas import MLPredictionResponse
from backend.services.ml_service import predict_flood

router = APIRouter(prefix="/api/ml", tags=["ML Прогнозирование"])


class CustomPredictionRequest(BaseModel):
    telemetry_window: List[Dict[str, Any]]
    thresholds: Dict[str, Any]


@router.get("/predict/{station_id}", response_model=MLPredictionResponse)
def get_station_ml_prediction(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Гидропост не найден")

    records = (
        db.query(Telemetry)
        .filter(Telemetry.station_id == station_id)
        .order_by(Telemetry.timestamp.desc())
        .limit(6)
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
        for t in reversed(records)
    ]

    thresholds = station.thresholds or {"warn_level": 900, "crit_level": 980, "max_rate_of_rise": 10}
    prediction = predict_flood(window, thresholds)
    return prediction


@router.post("/predict-custom", response_model=MLPredictionResponse)
def predict_custom(payload: CustomPredictionRequest):
    return predict_flood(payload.telemetry_window, payload.thresholds)
