from __future__ import annotations

from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from AI.utils.risk_utils import get_risk_level, get_risk_trend


FEATURE_ORDER = [
    "achievement_mean_7d",
    "adaptation_mean_7d",
    "relationship_mean_7d",
    "total_delta_7d",
]

_AI_DIR = Path(__file__).resolve().parents[1]
_MODEL_PATH = _AI_DIR / "models" / "process_ml_model.pkl"
_SCALER_PATH = _AI_DIR / "models" / "process_ml_scaler.pkl"

# Load model/scaler once at import time (do not reload per call).
_MODEL = joblib.load(_MODEL_PATH)
_SCALER = joblib.load(_SCALER_PATH)


def predict(features: dict, past_risk_scores: list | None = None) -> dict:
    missing = [col for col in FEATURE_ORDER if col not in features]
    if missing:
        raise ValueError(f"Missing required feature keys: {missing}")

    x = np.array([[float(features[col]) for col in FEATURE_ORDER]], dtype=float)
    x_df = pd.DataFrame(x, columns=FEATURE_ORDER)
    x_scaled = _SCALER.transform(x_df)
    risk_score_raw = float(_MODEL.predict_proba(x_scaled)[0, 1])
    risk_score = round(min(max(risk_score_raw, 0.0), 1.0), 4)

    risk_level = get_risk_level(risk_score)

    if past_risk_scores is None or len(past_risk_scores) < 5:
        risk_trend = "STABLE"
    else:
        recent_six = [float(v) for v in past_risk_scores[-5:]] + [risk_score]
        risk_trend = get_risk_trend(recent_six)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_trend": risk_trend,
    }


if __name__ == "__main__":
    features_stable = {
        "achievement_mean_7d": 4.2,
        "adaptation_mean_7d": 4.0,
        "relationship_mean_7d": 4.1,
        "total_delta_7d": 0.1,
    }
    result_stable = predict(features_stable)
    print("Case 1 (stable):", result_stable)
    assert result_stable["risk_level"] == "LOW"

    features_high = {
        "achievement_mean_7d": 1.5,
        "adaptation_mean_7d": 1.8,
        "relationship_mean_7d": 2.0,
        "total_delta_7d": -1.2,
    }
    result_high = predict(features_high)
    print("Case 2 (high):", result_high)
    assert result_high["risk_level"] == "HIGH"

    past_scores = [0.55, 0.60, 0.65, 0.70, 0.72]
    features_trend = {
        "achievement_mean_7d": 2.1,
        "adaptation_mean_7d": 2.3,
        "relationship_mean_7d": 2.5,
        "total_delta_7d": -0.8,
    }
    result_trend = predict(features_trend, past_scores)
    print("Case 3 (trend):", result_trend)
    assert result_trend["risk_trend"] == "UP"
