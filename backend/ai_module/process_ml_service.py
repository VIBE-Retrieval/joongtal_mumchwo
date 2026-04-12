from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pandas as pd

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from AI.features.feature_extractor import extract_features  # noqa: E402
from AI.predict.process_ml_predictor import predict  # noqa: E402

FEATURE_KEYS = [
    "achievement_mean_7d",
    "adaptation_mean_7d",
    "relationship_mean_7d",
    "total_delta_7d",
]


def _fallback_feature_row(
    student_id: str,
    survey_date: str,
    surveys_window: list[dict[str, Any]],
) -> dict[str, float]:
    rows = sorted(surveys_window, key=lambda r: r["survey_date"])
    ach = [int(r["achievement_score"]) for r in rows]
    ada = [int(r["adaptation_score"]) for r in rows]
    rel = [int(r["relationship_score"]) for r in rows]
    n = len(rows)
    w = min(7, n)
    achievement_mean_7d = sum(ach[-w:]) / float(w)
    adaptation_mean_7d = sum(ada[-w:]) / float(w)
    relationship_mean_7d = sum(rel[-w:]) / float(w)
    daily_avgs = [(ach[i] + ada[i] + rel[i]) / 3.0 for i in range(n)]
    if n >= 8:
        total_delta_7d = daily_avgs[-1] - daily_avgs[-8]
    else:
        total_delta_7d = 0.0
    return {
        "achievement_mean_7d": float(achievement_mean_7d),
        "adaptation_mean_7d": float(adaptation_mean_7d),
        "relationship_mean_7d": float(relationship_mean_7d),
        "total_delta_7d": float(total_delta_7d),
    }


def run_process_ml(
    *,
    student_id: str,
    survey_date: str,
    surveys_window: list[dict[str, Any]],
    past_risk_scores: list[float],
) -> dict[str, Any]:
    """
    surveys_window: 최근 7일(포함) daily_survey 행들. 각 dict는
      survey_date (YYYY-MM-DD), achievement_score, adaptation_score, relationship_score
    past_risk_scores: 해당 survey_date 이전 process_risk_history의 risk_score, 오래된 것부터.
    """
    if not surveys_window:
        raise ValueError("surveys_window must not be empty")

    rows = []
    for r in surveys_window:
        rows.append(
            {
                "student_id": student_id,
                "survey_date": r["survey_date"],
                "achievement_score": int(r["achievement_score"]),
                "adaptation_score": int(r["adaptation_score"]),
                "relationship_score": int(r["relationship_score"]),
                "label": 0,
            }
        )
    df = pd.DataFrame(rows)
    df["survey_date"] = pd.to_datetime(df["survey_date"])

    feature_snapshot: dict[str, float] | None = None
    try:
        feat_df = extract_features(df)
        matched = feat_df[feat_df["date"] == survey_date]
        if len(matched) == 1:
            row = matched.iloc[0]
            feature_snapshot = {k: float(row[k]) for k in FEATURE_KEYS}
    except (AssertionError, ValueError, KeyError):
        feature_snapshot = None

    if feature_snapshot is None:
        feature_snapshot = _fallback_feature_row(student_id, survey_date, surveys_window)

    ml_out = predict(feature_snapshot, past_risk_scores or None)

    return {
        "risk_score": ml_out["risk_score"],
        "risk_level": ml_out["risk_level"],
        "risk_trend": ml_out["risk_trend"],
        "feature_snapshot": feature_snapshot,
    }
