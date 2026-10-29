import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="guest", nullable=False)  # 'guest', 'operator', 'admin'
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), unique=True, index=True, nullable=True)  # MQTT device code
    region = Column(String(255), nullable=False)  # "Петропавловск (СКО)", "Астана", "Уральск"
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    hazard_type = Column(String(50), default="flood", nullable=False)  # 'flood', 'fire', 'air', 'landslide'
    status = Column(String(50), default="active", nullable=False)  # 'active', 'offline', 'error'
    thresholds = Column(JSON, nullable=False)  # {"warn_level": 900, "crit_level": 980, "max_rate_of_rise": 10}
    water_body_type = Column(String(50), default="urban", nullable=False)  # 'urban', 'small_river', 'stream', 'reservoir'
    catchment_area_km2 = Column(Float, nullable=True)
    response_time_h = Column(Float, nullable=True)
    alert_radius_m = Column(Integer, nullable=True)
    settlement = Column(String(255), nullable=True)
    river_name = Column(String(255), nullable=True)

    telemetry = relationship("Telemetry", back_populates="station", cascade="all, delete-orphan", order_by="desc(Telemetry.timestamp)")
    alerts = relationship("Alert", back_populates="station", cascade="all, delete-orphan", order_by="desc(Alert.created_at)")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    water_level = Column(Float, nullable=False)  # см
    rate_of_rise = Column(Float, default=0.0, nullable=False)  # см/ч
    rainfall = Column(Float, default=0.0, nullable=False)  # мм/ч
    temperature = Column(Float, default=10.0, nullable=False)  # °C
    soil_moisture = Column(Float, default=50.0, nullable=False)  # %
    is_valid = Column(Boolean, default=True, nullable=False)
    error_reason = Column(String(255), nullable=True)

    station = relationship("Station", back_populates="telemetry")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    hazard_type = Column(String(50), default="flood", nullable=False)
    risk_level = Column(String(50), nullable=False)  # 'low', 'medium', 'high'
    risk_score = Column(Float, nullable=False)  # 0-100
    explanation = Column(Text, nullable=False)
    forecast_1h = Column(Float, nullable=False)
    forecast_2h = Column(Float, nullable=False)
    forecast_3h = Column(Float, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # 'pending', 'published', 'declined'
    processed_by = Column(String(255), nullable=True)

    station = relationship("Station", back_populates="alerts")
