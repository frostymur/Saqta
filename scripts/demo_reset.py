#!/usr/bin/env python3
"""Reset one station to a clean demo baseline.

Examples:
    .venv/bin/python scripts/demo_reset.py --station-id 3
    .venv/bin/python scripts/demo_reset.py --code arduino-bridge-01 --level 930

Keeps the rest of the database intact: only alerts and recent telemetry for
the selected station are removed, then a flat hourly baseline is inserted.
"""
import argparse
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import SessionLocal
from backend.models import Alert, Station, Telemetry


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--station-id", type=int, default=3)
    group.add_argument("--code", default=None)
    parser.add_argument("--level", type=float, default=930.0, help="baseline water level, cm")
    parser.add_argument("--hours", type=int, default=24)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.code:
            station = db.query(Station).filter(Station.code == args.code).first()
        else:
            station = db.query(Station).filter(Station.id == args.station_id).first()
        if not station:
            print("Station not found")
            return 1

        alerts = db.query(Alert).filter(Alert.station_id == station.id).delete(
            synchronize_session=False
        )
        now_utc = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
        since = now_utc - datetime.timedelta(hours=args.hours)
        telemetry = (
            db.query(Telemetry)
            .filter(Telemetry.station_id == station.id, Telemetry.timestamp >= since)
            .delete(synchronize_session=False)
        )

        now = now_utc.replace(minute=0, second=0, microsecond=0)
        for hour in range(args.hours, 0, -1):
            db.add(
                Telemetry(
                    station_id=station.id,
                    timestamp=now - datetime.timedelta(hours=hour),
                    water_level=args.level,
                    rate_of_rise=0.0,
                    rainfall=0.0,
                    temperature=10.0,
                    soil_moisture=60.0,
                    is_valid=True,
                )
            )

        station.status = "active"
        db.commit()
        print(
            f"Reset station #{station.id} «{station.name}» "
            f"(code={station.code or '—'}): baseline {args.level} cm, "
            f"removed {telemetry} telemetry rows and {alerts} alerts."
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
