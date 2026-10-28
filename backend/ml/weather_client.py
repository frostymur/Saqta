"""Лёгкий клиент Open-Meteo для обогащения прогноза реальной погодой станции.

Станция: г. Петропавловск, р. Есиль (54.87 N, 69.15 E), часовой пояс Asia/Almaty.

- Кэширование ответов в /tmp (и/или каталоге SAQTA_WEATHER_CACHE) с TTL.
- Защита от таймаутов и сетевых ошибок: при сбое возвращается кэш или None.
- Никаких сторонних зависимостей, кроме stdlib (urllib).
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

# Координаты станции (Петропавловск, р. Есиль)
STATION_LAT = 54.87
STATION_LON = 69.15
TIMEZONE = "Asia/Almaty"

API_BASE = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1/archive"

DEFAULT_TIMEOUT = 8.0          # секунд на запрос
DEFAULT_CACHE_TTL = 900        # 15 минут для прогноза
ARCHIVE_TTL = 86400 * 7        # архивные данные не меняются — кэш на неделю
CACHE_DIR = os.environ.get("SAQTA_WEATHER_CACHE", os.path.join("/tmp", "saqta_weather_cache"))


def _cache_path(url: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    digest = os.path.basename(url) + "_" + str(hash(url))[:16] + ".json"
    # hash() нестабилен между запусками — сделаем стабильный суффикс
    stable = 0
    for ch in url:
        stable = (stable * 131 + ord(ch)) & 0xFFFFFFFF
    return os.path.join(CACHE_DIR, f"om_{stable}.json")


def _http_get_json(url: str, timeout: float) -> dict | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "saqta-kz/1.0 (flood-ml)"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError, json.JSONDecodeError):
        return None


def _cached_get(url: str, ttl: float, timeout: float) -> dict | None:
    """GET с дисковым кэшем: свежий кэш → ответ; при сбое сети → просроченный кэш."""
    path = _cache_path(url)
    try:
        if os.path.exists(path):
            age = time.time() - os.path.getmtime(path)
            if age < ttl:
                with open(path) as f:
                    return json.load(f)
    except (OSError, json.JSONDecodeError):
        pass

    data = _http_get_json(url, timeout)
    if data is not None:
        try:
            with open(path, "w") as f:
                json.dump(data, f)
            return data
        except OSError:
            return data
    # сеть упала — вернём просроченный кэш (best effort)
    try:
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None
    return None


def get_current_weather(timeout: float = DEFAULT_TIMEOUT, use_cache: bool = True) -> dict | None:
    """Текущие наблюдения: temperature_2m, precipitation, relative_humidity_2m, weather_code.

    Возвращает dict вида {"time": "...", "temperature": float, "rainfall": float,
    "humidity": float} или None при полном отсутствии данных.
    """
    params = {
        "latitude": STATION_LAT,
        "longitude": STATION_LON,
        "current": "temperature_2m,precipitation,relative_humidity_2m,weather_code",
        "timezone": TIMEZONE,
    }
    url = API_BASE + "?" + urllib.parse.urlencode(params)
    raw = _cached_get(url, DEFAULT_CACHE_TTL, timeout) if use_cache else _http_get_json(url, timeout)
    cur = (raw or {}).get("current")
    if not cur:
        return None
    return {
        "time": cur.get("time"),
        "temperature": cur.get("temperature_2m"),
        "rainfall": cur.get("precipitation") or 0.0,
        "humidity": cur.get("relative_humidity_2m"),
        "weather_code": cur.get("weather_code"),
    }


def get_hourly_precipitation_forecast(hours: int = 48, timeout: float = DEFAULT_TIMEOUT) -> list[dict] | None:
    """Почасовой прогноз осадков (мм/ч) на ближайшие `hours` часов.

    Возвращает [{"time": "...", "precipitation": float}, ...] (не больше `hours`)
    или None, если данные недоступны.
    """
    params = {
        "latitude": STATION_LAT,
        "longitude": STATION_LON,
        "hourly": "precipitation,temperature_2m",
        "forecast_days": min(max(hours, 1) // 24 + 1, 7),
        "timezone": TIMEZONE,
    }
    url = API_BASE + "?" + urllib.parse.urlencode(params)
    raw = _cached_get(url, DEFAULT_CACHE_TTL, timeout)
    hourly = (raw or {}).get("hourly")
    if not hourly or not hourly.get("precipitation"):
        return None
    times = hourly.get("time") or []
    pairs = list(zip(times, hourly["precipitation"]))[:hours]
    return [
        {"time": t, "precipitation": float(p or 0.0), "temperature": (
            hourly["temperature_2m"][i] if hourly.get("temperature_2m") else None)}
        for i, (t, p) in enumerate(pairs)
    ]


def get_archive_weather(start_date: str, end_date: str,
                        timeout: float = DEFAULT_TIMEOUT) -> dict | None:
    """Часовой архив (Open-Meteo Historical Weather API): температура и осадки.

    start_date/end_date в формате YYYY-MM-DD. Возвращает
    {"time": [...], "temperature": [...], "precipitation": [...]} или None.
    """
    params = {
        "latitude": STATION_LAT,
        "longitude": STATION_LON,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,precipitation,relative_humidity_2m",
        "timezone": TIMEZONE,
    }
    url = ARCHIVE_BASE + "?" + urllib.parse.urlencode(params)
    raw = _cached_get(url, ARCHIVE_TTL, timeout)
    hourly = (raw or {}).get("hourly")
    if not hourly or not hourly.get("time"):
        return None
    return {
        "time": hourly["time"],
        "temperature": hourly.get("temperature_2m") or [None] * len(hourly["time"]),
        "precipitation": hourly.get("precipitation") or [0.0] * len(hourly["time"]),
        "humidity": hourly.get("relative_humidity_2m") or [None] * len(hourly["time"]),
    }


# Точки сетки в верхнем течении бассейна Есиля (верховья: Алматинский
# предгорье → Усть-Каменогорск → Костанай) — пространственное усреднение
# даёт сток бассейна, а не только точку наблюдения в Петропавловске.
CATCHMENT_GRID = [
    (43.25, 77.05),   # юг: предгорья Тянь-Шаня (верховья)
    (44.96, 78.35),   # г. Алматы
    (43.30, 78.68),   # г. Усть-Каменогорск (Оскемен)
    (46.55, 79.72),   # север: Костанай (нижняя часть бассейна)
    (50.55, 69.18),   # центральное течение
    (54.87, 69.15),   # станция (Петропавловск)
]


def get_catchment_weather(start_date: str, end_date: str,
                          timeout: float = 30.0) -> dict | None:
    """Средние по бассейну почасовые осадки (мм/ч) и снегозапас (мм в.экв.).

    Один запрос Open-Meteo на все точки сетки (координаты через запятую).
    Возвращает {"time": [...], "precipitation": [...], "snow_water_equivalent": [...]}
    (усреднение по точкам) или None.
    """
    lats = ",".join(f"{la:.4f}" for la, _ in CATCHMENT_GRID)
    lons = ",".join(f"{lo:.4f}" for _, lo in CATCHMENT_GRID)
    params = {
        "latitude": lats,
        "longitude": lons,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "precipitation,snowfall_water_equivalent",
        "timezone": TIMEZONE,
    }
    url = ARCHIVE_BASE + "?" + urllib.parse.urlencode(params)
    raw = _cached_get(url, ARCHIVE_TTL, timeout)
    # multi-point: ответ — СПИСОК (по одному словарю на точку)
    points = raw if isinstance(raw, list) else [raw]
    points = [p for p in points if isinstance(p, dict) and p.get("hourly")]
    if not points:
        return None
    h0 = points[0]["hourly"]
    times = h0.get("time") or []
    n = len(times)
    avg_rain, avg_swe = [], []
    for i in range(n):
        rv, sv = [], []
        for p in points:
            r = p["hourly"].get("precipitation")
            s = p["hourly"].get("snowfall_water_equivalent")
            if r and r[i] is not None:
                rv.append(float(r[i]))
            if s and s[i] is not None:
                sv.append(float(s[i]))
        avg_rain.append(round(sum(rv) / len(rv), 2) if rv else 0.0)
        avg_swe.append(round(sum(sv) / len(sv), 1) if sv else 0.0)
    return {
        "time": times,
        "precipitation": avg_rain,
        "snowfall_water_equivalent": avg_swe,
    }


if __name__ == "__main__":
    # Смоук-тест: текущая погода + прогноз
    cur = get_current_weather()
    print("current:", cur)
    fc = get_hourly_precipitation_forecast(48)
    if fc:
        rainy = sum(1 for h in fc if h["precipitation"] >= 0.5)
        print(f"forecast: {len(fc)} ч, часов с осадками >=0.5 мм: {rainy}")
    else:
        print("forecast: недоступен (офлайн-режим)")
