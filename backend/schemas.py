import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, EmailStr, Field


# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Literal["guest", "operator", "admin"] = "guest"
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Station Schemas ---
class StationThresholds(BaseModel):
    warn_level: float = Field(..., description="Уровень предупреждения (см)")
    crit_level: float = Field(..., description="Критический уровень (см)")
    max_rate_of_rise: float = Field(..., description="Максимальная допустимая скорость подъема (см/ч)")

class StationCreate(BaseModel):
    name: str
    code: Optional[str] = Field(None, max_length=64, pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$")
    region: str
    lat: float
    lng: float
    hazard_type: Literal["flood", "fire", "air", "landslide"] = "flood"
    status: Literal["active", "offline", "error"] = "active"
    thresholds: StationThresholds

class StationUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = Field(None, max_length=64, pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$")
    region: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    hazard_type: Optional[Literal["flood", "fire", "air", "landslide"]] = None
    status: Optional[Literal["active", "offline", "error"]] = None
    thresholds: Optional[StationThresholds] = None

class StationResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    region: str
    lat: float
    lng: float
    hazard_type: str
    status: str
    health: str = "unknown"
    thresholds: Dict[str, Any]
    current_water_level: Optional[float] = None
    current_rate_of_rise: Optional[float] = None
    current_risk_level: Optional[str] = "low"
    last_updated: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


# --- Telemetry Schemas ---
class TelemetryCreate(BaseModel):
    station_id: Optional[int] = None
    station_code: Optional[str] = Field(None, max_length=64)
    timestamp: Optional[datetime.datetime] = None
    water_level: float
    rate_of_rise: Optional[float] = None
    rainfall: Optional[float] = 0.0
    temperature: Optional[float] = 10.0
    soil_moisture: Optional[float] = 50.0
    is_valid: Optional[bool] = True
    error_reason: Optional[str] = None

class TelemetryResponse(BaseModel):
    id: int
    station_id: int
    timestamp: datetime.datetime
    water_level: float
    rate_of_rise: float
    rainfall: float
    temperature: float
    soil_moisture: float
    is_valid: bool
    error_reason: Optional[str] = None

    class Config:
        from_attributes = True


class TelemetryLogResponse(TelemetryResponse):
    station_name: Optional[str] = None
    station_region: Optional[str] = None


# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: int
    station_id: int
    station_name: Optional[str] = None
    station_region: Optional[str] = None
    station_lat: Optional[float] = None
    station_lng: Optional[float] = None
    created_at: datetime.datetime
    hazard_type: str
    risk_level: str
    risk_score: float
    explanation: str
    forecast_1h: float
    forecast_2h: float
    forecast_3h: float
    status: str
    processed_by: Optional[str] = None

    class Config:
        from_attributes = True

class AlertProcessRequest(BaseModel):
    processed_by: Optional[str] = None
    notes: Optional[str] = None

class AlertDecisionRequest(BaseModel):
    action: Literal["approve", "decline"]
    processed_by: Optional[str] = None


# --- ML Schemas ---
class RiskFactor(BaseModel):
    name: str
    weight: float
    value: str

class MLPredictionResponse(BaseModel):
    risk_level: Literal["low", "medium", "high"]
    risk_score: float
    forecast_1h: float
    forecast_2h: float
    forecast_3h: float
    horizon: str = "3h"
    explanation: str
    factors: List[RiskFactor]
    model_type: str
    metrics: Dict[str, Any]


# --- Simulation Schemas ---
class SimulationScenarioRequest(BaseModel):
    scenario: Literal["normal", "spring_flood_surge", "dam_spillover_crit", "heavy_rainfall"]
    intensity: float = Field(1.0, ge=0.5, le=3.0)
    station_id: Optional[int] = None
