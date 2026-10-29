from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Station
from backend.services.geo import validate_station

router = APIRouter(prefix="/api/geo", tags=["Геопроверка"])


@router.get("/validate")
def validate_regions(db: Session = Depends(get_db)):
    """Сверяет координаты гидропостов с административными границами РК."""
    stations = db.query(Station).order_by(Station.id).all()
    rows = [validate_station(station) for station in stations]
    mismatches = [row for row in rows if not row["ok"]]
    return {
        "checked": len(rows),
        "ok_count": len(rows) - len(mismatches),
        "mismatch_count": len(mismatches),
        "source": "geoBoundaries KAZ ADM1, ODbL",
        "stations": rows,
    }
