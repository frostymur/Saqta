"""Проверка координат гидропостов по административным границам Казахстана.

Запуск:
    PYTHONPATH=. .venv/bin/python scripts/check_geo.py
"""
import sys

from backend.database import SessionLocal
from backend.models import Station
from backend.services.geo import validate_station


def main() -> int:
    db = SessionLocal()
    try:
        rows = [
            validate_station(station)
            for station in db.query(Station).order_by(Station.id).all()
        ]
    finally:
        db.close()

    width = max((len(row["name"]) for row in rows), default=12)
    for row in rows:
        status = "OK" if row["ok"] else "MISMATCH"
        print(
            f"{row['station_id']:>3}  {row['name']:<{width}}  "
            f"{row['region']:<22}  {str(row['admin_unit']):<28} {status}"
        )

    bad = sum(1 for row in rows if not row["ok"])
    print(f"\n{len(rows) - bad}/{len(rows)} OK")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
