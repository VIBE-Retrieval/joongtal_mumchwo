from __future__ import annotations

from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from AI.utils.risk_utils import get_risk_level


FEATURE_ORDER = [
    "achievement_score",
    "achievement_problem_solving",
    "achievement_self_learning",
    "achievement_process_clarity",
    "adaptation_score",
    "adaptation_accepts_difficulty",
    "adaptation_persistence",
    "adaptation_strategy_variety",
    "relationship_score",
    "relationship_collaboration",
    "relationship_conflict_handling",
    "relationship_help_exchange",
    "achievement_sub_mean",
    "adaptation_sub_mean",
    "relationship_sub_mean",
    "overall_interview_mean",
    "interview_balance_score",
]

_AI_DIR = Path(__file__).resolve().parents[1]
_MODEL_PATH = _AI_DIR / "models" / "interview_ml_model.pkl"
_SCALER_PATH = _AI_DIR / "models" / "interview_ml_scaler.pkl"

# Load model/scaler once at import time.
_MODEL = joblib.load(_MODEL_PATH)
_SCALER = joblib.load(_SCALER_PATH)


def predict_interview(features: dict) -> dict:
    missing = [col for col in FEATURE_ORDER if col not in features]
    if missing:
        raise ValueError(f"Missing required feature keys: {missing}")

    x = np.array([[float(features[col]) for col in FEATURE_ORDER]], dtype=float)
    x_df = pd.DataFrame(x, columns=FEATURE_ORDER)
    x_scaled = _SCALER.transform(x_df)
    risk_score_raw = float(_MODEL.predict_proba(x_scaled)[0, 1])
    risk_score = round(min(max(risk_score_raw, 0.0), 1.0), 4)

    return {
        "dropout_risk_score": risk_score,
        "dropout_risk_level": get_risk_level(risk_score),
    }


if __name__ == "__main__":
    low_case = {
        "achievement_score": 1,
        "achievement_problem_solving": 1,
        "achievement_self_learning": 1,
        "achievement_process_clarity": 2,
        "adaptation_score": 1,
        "adaptation_accepts_difficulty": 1,
        "adaptation_persistence": 2,
        "adaptation_strategy_variety": 1,
        "relationship_score": 1,
        "relationship_collaboration": 2,
        "relationship_conflict_handling": 1,
        "relationship_help_exchange": 1,
        "achievement_sub_mean": (1 + 1 + 2) / 3,
        "adaptation_sub_mean": (1 + 2 + 1) / 3,
        "relationship_sub_mean": (2 + 1 + 1) / 3,
        "overall_interview_mean": (1 + 1 + 1) / 3,
        "interview_balance_score": 0.0,
    }
    low_result = predict_interview(low_case)
    print("Low score case:", low_result)
    assert low_result["dropout_risk_level"] == "HIGH"

    high_case = {
        "achievement_score": 5,
        "achievement_problem_solving": 5,
        "achievement_self_learning": 4,
        "achievement_process_clarity": 5,
        "adaptation_score": 5,
        "adaptation_accepts_difficulty": 4,
        "adaptation_persistence": 5,
        "adaptation_strategy_variety": 5,
        "relationship_score": 5,
        "relationship_collaboration": 5,
        "relationship_conflict_handling": 4,
        "relationship_help_exchange": 5,
        "achievement_sub_mean": (5 + 4 + 5) / 3,
        "adaptation_sub_mean": (4 + 5 + 5) / 3,
        "relationship_sub_mean": (5 + 4 + 5) / 3,
        "overall_interview_mean": (5 + 5 + 5) / 3,
        "interview_balance_score": 0.0,
    }
    high_result = predict_interview(high_case)
    print("High score case:", high_result)
    assert high_result["dropout_risk_level"] == "LOW"
