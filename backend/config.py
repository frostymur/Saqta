import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Saqta.kz — Система мониторинга и прогнозирования ЧС"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////home/timur/projects/saqta/backend/saqta.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "saqta-secret-key-digital-urpaq-2026-esil-kazakhstan")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for hackathon convenience
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1/forecast"

    # MQTT ingest
    MQTT_ENABLED: bool = False
    MQTT_HOST: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_TOPIC: str = "floodwatch/telemetry/#"
    MQTT_STATUS_TOPIC: str = "floodwatch/status/#"
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_CLIENT_ID: str = "saqta-backend"

    # Petropavlovsk coordinates
    PETROPAVLOVSK_LAT: float = 54.8753
    PETROPAVLOVSK_LNG: float = 69.1389

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
