"""Проверка принадлежности гидропостов административным единицам Казахстана.

Границы ADM1 (16 единиц) лежат в backend/data/kz_adm1.geojson
(geoBoundaries, ODbL). Поиск — ray casting с bbox-префильтром: O(единиц),
поэтому проверка масштабируется на любое число станций.
"""
import json
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "kz_adm1.geojson"

# Регион дашборда -> допустимые административные единицы (shapeName из GeoJSON).
REGION_ADMIN = {
    "Петропавловск (СКО)": {"North Kazakhstan Region"},
    "Астана": {"Astana", "Akmola Region"},
    "Уральск (ЗКО)": {"West Kazakhstan Region"},
    "Атырау": {"Atyrau Region"},
    "Костанай": {"Kostanay Region"},
    "Актобе": {"Aktobe Region"},
}

_cache = None


def _load_units():
    global _cache
    if _cache is not None:
        return _cache

    with _DATA_PATH.open(encoding="utf-8") as handle:
        collection = json.load(handle)

    units = []
    for feature in collection["features"]:
        geometry = feature["geometry"]
        polygons = (
            [geometry["coordinates"]]
            if geometry["type"] == "Polygon"
            else geometry["coordinates"]
        )
        # Внешнее кольцо + дырки: Астана вырезана из Акмолинской области.
        shapes = [(polygon[0], polygon[1:]) for polygon in polygons]
        xs = [point[0] for outer, _ in shapes for point in outer]
        ys = [point[1] for outer, _ in shapes for point in outer]
        units.append(
            {
                "name": feature["properties"].get("shapeName") or "?",
                "shapes": shapes,
                "bbox": (min(xs), min(ys), max(xs), max(ys)),
            }
        )
    _cache = units
    return _cache


def _in_ring(lng, lat, ring):
    inside = False
    j = len(ring) - 1
    for i, (xi, yi) in enumerate(ring):
        xj, yj = ring[j]
        if ((yi > lat) != (yj > lat)) and (
            lng < (xj - xi) * (lat - yi) / (yj - yi) + xi
        ):
            inside = not inside
        j = i
    return inside


def locate_admin(lat, lng):
    """Название административной единицы (ADM1) или None."""
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        return None

    for unit in _load_units():
        x0, y0, x1, y1 = unit["bbox"]
        if not (x0 <= lng <= x1 and y0 <= lat <= y1):
            continue
        for outer, holes in unit["shapes"]:
            if _in_ring(lng, lat, outer) and not any(
                _in_ring(lng, lat, hole) for hole in holes
            ):
                return unit["name"]
    return None


def validate_station(station):
    admin = locate_admin(station.lat, station.lng)
    expected = REGION_ADMIN.get(station.region)
    return {
        "station_id": station.id,
        "name": station.name,
        "region": station.region,
        "lat": station.lat,
        "lng": station.lng,
        "admin_unit": admin,
        "expected": sorted(expected) if expected else None,
        "ok": bool(expected and admin in expected),
    }
