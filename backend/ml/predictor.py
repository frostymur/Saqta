"""
predictor.py — боевой модуль инференса и Explainable AI для Saqta.kz.

Импортируется из FastAPI-бэкенда:

    from backend.ml.predictor import predict_flood_risk
    result = predict_flood_risk(telemetry_window, thresholds)

Контракт
--------
predict_flood_risk(telemetry_window: list[dict], thresholds: dict) -> dict

Вход:
    telemetry_window — последние замеры станции (1–ч, каждый элемент:
        water_level, rate_of_rise, rainfall, temperature, soil_moisture);
    thresholds — пороги станции, например
        {"warn_level": 940, "crit_level": 980, "max_rate_of_rise": 10}.

Выход (СТРОГО):
    {
        "risk_level": "low" | "medium" | "high",
        "risk_score": 0.0..100.0 (1 знак),
        "forecast_1h": float (1 знак),
        "forecast_2h": float (1 знак),
        "forecast_3h": float (1 знак),
        "horizon": "3h",
        "explanation": str (русский, для оператора ДЧС),
        "factors": [{"name": str, "weight": float (сумма = 1.0), "value": str}],
        "model_type": str,
        "metrics": {"mae": float, "rmse": float, "r2": float},
    }

Модель (flood_model.joblib) грузится ОДИН раз при первом обращении —
кэш на уровне модуля, потокобезопасно.
"""
from __future__ import annotations

import os
import threading

import joblib
import numpy as np

ML_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT = os.path.join(ML_DIR, "flood_model.joblib")

DEFAULT_THRESHOLDS = {"warn_level": 940.0, "crit_level": 980.0,
                      "max_rate_of_rise": 10.0}
MODEL_TYPE = "ML HistGradientBoosting (Multi-Horizon 1-3h, MultiOutputRegressor)"

FEATURES = ["water_level", "rate_of_rise", "accel_of_rise", "rainfall",
            "temperature", "soil_moisture", "dist_to_crit_ratio"]

_bundle: dict | None = None
_load_lock = threading.Lock()


def _load_bundle() -> dict:
    """Загрузка модели + скейлера + метрик (один раз, с кэшем)."""
    global _bundle
    if _bundle is not None:
        return _bundle
    with _load_lock:
        if _bundle is None:
            if not os.path.exists(ARTIFACT):
                raise FileNotFoundError(
                    f"Артефакт модели не найден: {ARTIFACT}. "
                    "Сначала запустите: python backend/ml/train_model.py")
            _bundle = joblib.load(ARTIFACT)
    return _bundle


# ---------------------------------------------------------------------------
# Извлечение признаков из телеметрии
# ---------------------------------------------------------------------------
def _last_obs(window: list[dict]) -> dict:
    """Последний замер + производные (accel) из окна."""
    if not window:
        raise ValueError("telemetry_window пуст")
    last = window[-1]

    def f(key: str, default: float = 0.0) -> float:
        try:
            v = last.get(key, default)
            return float(v) if v is not None else default
        except (TypeError, ValueError):
            return default

    level = f("water_level")
    rate = f("rate_of_rise")
    rain = f("rainfall")
    temp = f("temperature")
    soil = f("soil_moisture", 50.0)

    # accel_of_rise — разница скоростей (если не задан явно)
    accel = last.get("accel_of_rise", None)
    if accel is None and len(window) >= 2:
        try:
            prev_rate = float(window[-2].get("rate_of_rise", rate))
            accel = rate - prev_rate
        except (TypeError, ValueError):
            accel = 0.0
    elif accel is None:
        accel = 0.0
    else:
        try:
            accel = float(accel)
        except (TypeError, ValueError):
            accel = 0.0

    return {
        "water_level": level,
        "rate_of_rise": rate,
        "accel_of_rise": accel,
        "rainfall": rain,
        "temperature": temp,
        "soil_moisture": soil,
    }


def _feature_vector(obs: dict, crit_level: float) -> np.ndarray:
    dist = obs["water_level"] / crit_level if crit_level > 0 else 0.0
    x = [obs[k] for k in ["water_level", "rate_of_rise", "accel_of_rise",
                          "rainfall", "temperature", "soil_moisture"]] + [dist]
    return np.asarray(x, dtype=float).reshape(1, -1)


# ---------------------------------------------------------------------------
# Оценка риска (0..100)
# ---------------------------------------------------------------------------
def _level_component(level: float, warn: float, crit: float) -> float:
    """Монотонная шкала: ниже warn → 0..40, warn..crit → 40..80, выше crit → 80..100."""
    if level >= crit:
        return min(100.0, 80.0 + 20.0 * min((level - crit) / 100.0, 1.0))
    if level >= warn:
        span = max(crit - warn, 1.0)
        return 40.0 + 40.0 * (level - warn) / span
    span = max(warn - 400.0, 1.0)  # 400 см — около меженьного уровня
    return max(0.0, 40.0 * (level - 400.0) / span)


def _compute_risk(level: float, forecasts: dict, rate: float,
                  warn: float, crit: float, max_rate: float) -> float:
    fc_worst = max(forecasts.values())
    level_part = _level_component(level, warn, crit)
    fc_part = _level_component(fc_worst, warn, crit)
    rate_part = 100.0 * min(max(rate, 0.0) / max_rate, 1.5) / 1.5
    score = 0.5 * level_part + 0.3 * fc_part + 0.2 * rate_part
    # жёсткие правила: превышение крит. порога — всегда high
    if level >= crit or fc_worst >= crit:
        score = max(score, 78.0)
    if level >= warn or fc_worst >= warn:
        score = max(score, 45.0)
    return round(float(np.clip(score, 0.0, 100.0)), 1)


def _risk_level(score: float, level: float, forecasts: dict,
                warn: float, crit: float) -> str:
    if score >= 70 or level >= crit or max(forecasts.values()) >= crit:
        return "high"
    if score >= 40 or level >= warn or max(forecasts.values()) >= warn:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Explainable AI: динамические веса факторов (сумма = 1.0)
# ---------------------------------------------------------------------------
def _factors(obs: dict, forecasts: dict, warn: float, crit: float,
             max_rate: float) -> list[dict]:
    level = obs["water_level"]
    rate = obs["rate_of_rise"]
    rain = obs["rainfall"]
    temp = obs["temperature"]
    soil = obs["soil_moisture"]

    # «сырые» взвешенные влияния для конкретной ситуации
    raw_rate = min(max(rate, 0.0) / max_rate, 3.0)
    raw_crit = max(0.0, (level / crit - 0.5) / 0.5)
    wet_bonus = (1.5 if temp > 2.0 else 1.0) * (1.3 if soil > 80.0 else 1.0)
    raw_rain = min(rain, 20.0) / 10.0 * wet_bonus
    # если впереди превышение порога — усиливаем вклад «приближения к отметке»
    if max(forecasts.values()) >= warn:
        raw_crit *= 1.5

    raw = {"rate": raw_rate, "crit": raw_crit, "rain": raw_rain}
    total = sum(raw.values())
    if total <= 1e-9:
        w = {"rate": 0.30, "crit": 0.50, "rain": 0.20}
    else:
        w = {k: v / total for k, v in raw.items()}

    # округление до 2 знаков с сохранением суммы 1.0
    w_rate = round(w["rate"], 2)
    w_crit = round(w["crit"], 2)
    w_rain = round(1.0 - w_rate - w_crit, 2)

    return [
        {"name": "Скорость подъема воды",
         "weight": w_rate,
         "value": f"{'+' if rate >= 0 else '-'}{abs(rate):.1f} см/ч"},
        {"name": "Приближение к крит. отметке",
         "weight": w_crit,
         "value": f"{level:.1f} / {crit:.1f} см"},
        {"name": "Осадки и температура (сток)",
         "weight": w_rain,
         "value": f"{rain:.1f} мм/ч, {'+' if temp >= 0 else '-'}{abs(temp):.1f}°C"},
    ]


def _explanation(forecasts: dict, level: float, warn: float, crit: float,
                 factors: list[dict], obs: dict) -> str:
    """Читаемое обоснование для оператора ДЧС."""
    # самый ранний горизонт, дающий максимум прогноза
    worst = max(forecasts, key=lambda h: forecasts[h])
    fc = forecasts[worst]
    if fc >= crit:
        fc_note = f"превышение критического порога {crit:.0f} см"
    elif fc >= warn:
        fc_note = f"превышение предупредительного порога {warn:.0f} см"
    else:
        fc_note = f"ниже предупредительного порога {warn:.0f} см"

    top = max(factors, key=lambda f: f["weight"])
    parts = [f"Прогноз на +{worst}: {fc:.1f} см ({fc_note}).",
             f"Главный фактор: {top['name'].lower()} ({top['value']}, "
             f"вклад {round(top['weight'] * 100)}%)."]
    # контекст второго фактора
    second = sorted(factors, key=lambda f: -f["weight"])[1]
    if second["name"].startswith("Осадки"):
        parts.append(f"На фоне {'обильных' if obs['rainfall'] > 5 else 'умеренных/малых'} "
                     f"осадков ({obs['rainfall']:.1f} мм/ч) "
                     f"и температуры {'+' if obs['temperature'] >= 0 else '-'}"
                     f"{abs(obs['temperature']):.1f}°C.")
    else:
        parts.append(f"Сопутствующий фактор: {second['name'].lower()} ({second['value']}).")
    return " ".join(parts)


# ---------------------------------------------------------------------------
# Публичный контракт
# ---------------------------------------------------------------------------
def predict_flood_risk(telemetry_window: list[dict], thresholds: dict) -> dict:
    """Прогноз риска паводка на 1–3 часа для станции (контракт Saqta.kz)."""
    if not isinstance(telemetry_window, list) or not telemetry_window:
        raise ValueError("telemetry_window должен быть непустым списком замеров")
    th = dict(DEFAULT_THRESHOLDS)
    th.update(thresholds or {})
    warn = float(th.get("warn_level", DEFAULT_THRESHOLDS["warn_level"]))
    crit = float(th.get("crit_level", DEFAULT_THRESHOLDS["crit_level"]))
    max_rate = max(float(th.get("max_rate_of_rise", DEFAULT_THRESHOLDS["max_rate_of_rise"])), 0.1)

    bundle = _load_bundle()
    model, scaler = bundle["model"], bundle["scaler"]
    # Признак dist_to_crit_ratio строится от уровня ЧС станции (константа
    # обучения), а НЕ от warn/crit из thresholds — иначе сдвиг распределения
    crit_feature = float(bundle.get("station_crit_level", 1150.0))

    obs = _last_obs(telemetry_window)
    x = _feature_vector(obs, crit_feature)
    preds = model.predict(scaler.transform(x))[0]

    # Модель предсказывает ОСТАТОК от импульсного базиса
    #   baseline_h = water_level + rate_of_rise·h
    # (см. train_model.py: целевая = target_h − baseline_h).
    # Абсолютный прогноз уровня восстанавливается суммированием.
    # Для legacy-бандла (без ключа "residual") preds уже абсолютные.
    hz = bundle.get("horizons", [1, 2, 3])
    level0, rate0 = obs["water_level"], obs["rate_of_rise"]
    if bundle.get("residual", False):
        forecasts = {
            f"{h}h": float(level0 + rate0 * h + preds[i])
            for i, h in enumerate(hz)
        }
    else:
        forecasts = {f"{hz[i]}h": float(preds[i]) for i in range(len(hz))}

    risk_score = _compute_risk(obs["water_level"], forecasts,
                               obs["rate_of_rise"], warn, crit, max_rate)
    risk_level = _risk_level(risk_score, obs["water_level"], forecasts, warn, crit)
    factors = _factors(obs, forecasts, warn, crit, max_rate)
    explanation = _explanation(forecasts, obs["water_level"], warn, crit, factors, obs)

    metrics = bundle.get("metrics", {})
    return {
        "risk_level": risk_level,
        "risk_score": round(float(risk_score), 1),
        "forecast_1h": round(forecasts["1h"], 1),
        "forecast_2h": round(forecasts["2h"], 1),
        "forecast_3h": round(forecasts["3h"], 1),
        "horizon": "3h",
        "explanation": explanation,
        "factors": factors,
        "model_type": bundle.get("model_type", MODEL_TYPE),
        "metrics": {
            "mae": metrics.get("mae", 0.0),
            "rmse": metrics.get("rmse", 0.0),
            "r2": metrics.get("r2", 0.0),
        },
    }


if __name__ == "__main__":
    # Смоук-режимы: спокойный паводок / пик 2024 / ливень при подъёме
    scenarios = [
        ("Спокойно (апр. начало)", [
            {"water_level": 720.0, "rate_of_rise": 1.2, "rainfall": 0.3,
             "temperature": 3.5, "soil_moisture": 78.0}]),
        ("Быстрый подъём под крит.", [
            {"water_level": 945.0, "rate_of_rise": 14.0, "rainfall": 14.2,
             "temperature": 8.0, "soil_moisture": 92.0},
            {"water_level": 965.0, "rate_of_rise": 16.0, "rainfall": 15.0,
             "temperature": 8.5, "soil_moisture": 94.0}]),
        ("Пик половодья 2024 (1355 см)", [
            {"water_level": 1340.0, "rate_of_rise": 4.0, "rainfall": 1.0,
             "temperature": 11.0, "soil_moisture": 99.0},
            {"water_level": 1355.0, "rate_of_rise": 3.0, "rainfall": 0.8,
             "temperature": 11.5, "soil_moisture": 99.0}]),
    ]
    import json as _json
    for name, win in scenarios:
        res = predict_flood_risk(win, {"warn_level": 940, "crit_level": 980,
                                       "max_rate_of_rise": 10})
        print(f"\n=== {name} ===")
        print(_json.dumps(res, ensure_ascii=False, indent=2))
