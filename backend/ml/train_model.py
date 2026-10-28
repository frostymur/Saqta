#!/usr/bin/env python3
"""
train_model.py — обучение и валидация ML-модели прогноза уровня р. Есиль
(г. Петропавловск) на горизонты +1ч / +2ч / +3ч.

- Модель: HistGradientBoostingRegressor (нативная multi-output) —
  одновременно три цели: target_1h, target_2h, target_3h (см).
- Признаки: water_level, rate_of_rise, accel_of_rise, rainfall, temperature,
  soil_moisture, dist_to_crit_ratio.
- Разбиение: ХРОНОЛОГИЧЕСКОЕ train/test 80/20 (без shuffle) — честная
  проверка на «будущее», как в боевом инференсе.
- Метрики: MAE / RMSE / R2 для каждого горизонта + средние.
- Артефакт: backend/ml/flood_model.joblib
  {"model", "scaler", "features", "metrics", "model_type", "thresholds"}
"""
from __future__ import annotations

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import StandardScaler

ML_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.join(ML_DIR, "data", "kazakhstan_flood_dataset.csv")
ARTIFACT = os.path.join(ML_DIR, "flood_model.joblib")

# Признаки модели — строго то, что доступно в момент инференса из
# telemetry_window (контракт predict_flood_risk) + dist_to_crit_ratio,
# вычисляемый от уровня ЧС станции. Признаки бассейна (rainfall_catchment,
# snow_water_equivalent) есть в датасете, но МОДЕЛЬЮ НЕ ИСПОЛЬЗУЮТСЯ:
# на горизонте 1–3 ч сток из верхнего бассейна не успевает дойти до станции
# (измеренный прирост MAE ~0, см. отчёт), а значение на входе неизвестно —
# подстановка 0 вызвала бы сдвиг распределения.
FEATURES = ["water_level", "rate_of_rise", "accel_of_rise", "rainfall",
            "temperature", "soil_moisture", "dist_to_crit_ratio"]
TARGETS = ["target_1h", "target_2h", "target_3h"]

# Пороги станции (дублируются в thresholds при обучении; predictor может
# переопределить их на входе predict_flood_risk)
DEFAULT_THRESHOLDS = {"warn_level": 940.0, "crit_level": 980.0,
                      "max_rate_of_rise": 10.0}
# Уровень ЧС станции Есиль-Петропавловск (см) — константа признака
# dist_to_crit_ratio = water_level / STATION_CRIT_LEVEL (как в датасете)
STATION_CRIT_LEVEL = 1150.0
MODEL_TYPE = "ML HistGradientBoosting (Multi-Horizon 1-3h, MultiOutputRegressor)"


def load_dataset(path: str = DATASET) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["datetime"]).sort_values("datetime").reset_index(drop=True)
    missing = [c for c in FEATURES + TARGETS if c not in df.columns]
    if missing:
        raise ValueError(f"В датасете отсутствуют колонки: {missing}")
    return df


# Разбиение: обучение — вся известная история (2023 + паводок 2024),
# тест — последние данные (май 2024, спад паводка). Хронологическое, без shuffle:
# модель обучена на прошлом и проверяется на «ближайшем будущем», как в бою.
TEST_CUTOFF = pd.Timestamp("2024-05-01 00:00")


def make_model() -> MultiOutputRegressor:
    """Multi-output: один регрессор на каждый горизонт (+1ч, +2ч, +3ч)."""
    base = HistGradientBoostingRegressor(
        loss="squared_error",
        learning_rate=0.06,
        max_iter=900,
        max_leaf_nodes=31,
        min_samples_leaf=40,
        l2_regularization=1.0,
        max_bins=255,
        random_state=42,
        n_iter_no_change=40,
        validation_fraction=0.1,
    )
    return MultiOutputRegressor(base, n_jobs=2)


def main() -> None:
    df = load_dataset()
    print(f"[train] датасет: {len(df)} строк, {df['datetime'].min()} … {df['datetime'].max()}")

    # При офлайн-генерации признаки бассейна могут отсутствовать — обучаем
    # на том, что есть (ядро модели не меняется).
    feats = [f for f in FEATURES if f in df.columns]
    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        print(f"[train] без признаков (нет данных бассейна): {missing}")

    X = df[feats].to_numpy(dtype=float)
    y = df[TARGETS].to_numpy(dtype=float)

    # Целевая функция: ОШИБОКА базисного «импульсного» прогноза
    #   baseline_h(t) = water_level(t) + rate_of_rise(t)·h
    # Быстрая медленная река почти линейна на 1–3 ч, поэтому остаток
    # мал, стационарен и предсказуем по погоде (чистый уровень модель
    # воспроизводила с MAE ~55 см на спаде, остаток — ~2 см).
    lvl, rate = df["water_level"].to_numpy(dtype=float), df["rate_of_rise"].to_numpy(dtype=float)
    y_res = y - np.stack([lvl + rate * h for h in (1, 2, 3)], axis=1)

    # Хронологическое разбиение по кат-оффу (без shuffle): train = история,
    # test = последние данные после кат-оффа.
    is_test = df["datetime"] >= TEST_CUTOFF
    train_idx = df.index[~is_test].to_numpy()
    test_idx = df.index[is_test].to_numpy()
    X_tr, X_te = X[train_idx], X[test_idx]
    y_tr, y_te = y_res[train_idx], y_res[test_idx]
    print(f"[train] train={len(train_idx)} ({df['datetime'].iloc[train_idx[0]]} … "
          f"{df['datetime'].iloc[train_idx[-1]]})  test={len(test_idx)} "
          f"({df['datetime'].iloc[test_idx[0]]} … {df['datetime'].iloc[test_idx[-1]]})")
    print("[train] целевая: остатки от baseline level+rate·h (1–3 ч)")

    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_tr)
    X_te = scaler.transform(X_te)

    model = make_model()
    model.fit(X_tr, y_tr)

    # Восстановление абсолютного прогноза уровня: baseline + residual
    base_te = np.stack([lvl[test_idx] + rate[test_idx] * h for h in (1, 2, 3)], axis=1)
    y_pred = base_te + model.predict(X_te)
    y_abs_te = y[test_idx]  # абсолютные целевые уровни (не остатки)
    metrics = {"per_horizon": {}, "mae": 0.0, "rmse": 0.0, "r2": 0.0}
    for j, t in enumerate(TARGETS):
        mae = mean_absolute_error(y_abs_te[:, j], y_pred[:, j])
        rmse = float(np.sqrt(mean_squared_error(y_abs_te[:, j], y_pred[:, j])))
        r2 = r2_score(y_abs_te[:, j], y_pred[:, j])
        metrics["per_horizon"][t] = {"mae": round(mae, 3), "rmse": round(rmse, 3), "r2": round(float(r2), 4)}
        print(f"[metrics] {t}: MAE={mae:.3f} см  RMSE={rmse:.3f} см  R2={r2:.4f}")

    # средние по горизонтам — сводные метрики в контракт
    metrics["mae"] = round(float(np.mean([metrics["per_horizon"][t]["mae"] for t in TARGETS])), 2)
    metrics["rmse"] = round(float(np.mean([metrics["per_horizon"][t]["rmse"] for t in TARGETS])), 2)
    metrics["r2"] = round(float(np.mean([metrics["per_horizon"][t]["r2"] for t in TARGETS])), 3)
    print(f"[metrics] средние: MAE={metrics['mae']}  RMSE={metrics['rmse']}  R2={metrics['r2']}")

    bundle = {
        "model": model,
        "scaler": scaler,
        "features": feats,
        "targets": TARGETS,
        "metrics": metrics,
        "model_type": MODEL_TYPE,
        "residual": True,
        "horizons": [1, 2, 3],
        "thresholds": DEFAULT_THRESHOLDS,
        "station_crit_level": STATION_CRIT_LEVEL,
        "dataset_rows": int(len(df)),
        "train_cutoff": str(df["datetime"].iloc[train_idx[-1]]),
        "test_cutoff": str(df["datetime"].iloc[test_idx[-1]]),
    }
    joblib.dump(bundle, ARTIFACT)
    print(f"[train] артефакт сохранён: {ARTIFACT} ({os.path.getsize(ARTIFACT)/1e6:.2f} МБ)")

    # Короткая сводка для логирования
    print(json.dumps({"metrics": metrics}, ensure_ascii=False))


if __name__ == "__main__":
    main()
