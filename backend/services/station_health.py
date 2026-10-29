import datetime
from typing import Optional

from backend.models import Station, Telemetry

# Telemetry from field stations normally arrives hourly; the demo Arduino
# publishes every few seconds, so these are only fallbacks when no live
# MQTT status is available.
HEALTH_STALE_AFTER = datetime.timedelta(hours=3)
HEALTH_OFFLINE_AFTER = datetime.timedelta(hours=24)


def station_health(station: Station, latest: Optional[Telemetry]) -> str:
    if station.status == "offline":
        return "offline"
    if station.status == "error" or (latest is not None and latest.is_valid is False):
        return "error"
    # MQTT status can mark a station online before the first telemetry arrives.
    # Fall back to the last reading for databases created before last_seen.
    last_seen = station.last_seen or (latest.timestamp if latest else None)
    if last_seen is None:
        return "offline"
    age = datetime.datetime.utcnow() - last_seen
    if age >= HEALTH_OFFLINE_AFTER:
        return "offline"
    if age >= HEALTH_STALE_AFTER:
        return "stale"
    return "online"
