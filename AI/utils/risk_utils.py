from __future__ import annotations

from typing import Sequence


def get_risk_level(risk_score: float) -> str:
    if not (0.0 <= risk_score <= 1.0):
        raise ValueError(f"risk_score must be in [0, 1], got {risk_score}")

    if risk_score <= 0.33:
        return "LOW"
    if risk_score <= 0.66:
        return "MEDIUM"
    return "HIGH"


def get_risk_trend(scores: Sequence[float]) -> str:
    if len(scores) != 6:
        raise ValueError("scores must contain exactly 6 values")

    prev_avg = sum(scores[:3]) / 3.0
    recent_avg = sum(scores[3:]) / 3.0

    if recent_avg > prev_avg + 0.05:
        return "UP"
    if recent_avg < prev_avg - 0.05:
        return "DOWN"
    return "STABLE"
