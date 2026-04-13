from __future__ import annotations

from typing import Any


ACTION_TYPES = [
    "NONE",
    "ENCOURAGE_MESSAGE",
    "ALERT_MENTOR",
    "REQUEST_MEETING",
    "EMERGENCY",
]

# Tie-break preference (stronger intervention first)
TIE_BREAK_ORDER = [
    "EMERGENCY",
    "REQUEST_MEETING",
    "ALERT_MENTOR",
    "ENCOURAGE_MESSAGE",
    "NONE",
]

INTERVENTION_STRENGTH = {
    "NONE": 0,
    "ENCOURAGE_MESSAGE": 1,
    "ALERT_MENTOR": 2,
    "REQUEST_MEETING": 3,
    "EMERGENCY": 4,
}


def _clamp_score(value: float) -> float:
    return max(0.0, min(1.0, value))


def _build_action_scores(agent_input: dict[str, Any]) -> dict[str, float]:
    interview_risk_score = float(agent_input.get("interview_risk_score", 0.5))
    process_risk_score = float(agent_input["process_risk_score"])
    risk_level = str(agent_input["risk_level"])
    risk_trend = str(agent_input["risk_trend"])
    consecutive_risk_days = int(agent_input["consecutive_risk_days"])
    risk_type = str(agent_input["risk_type"])

    past_high_risk_count = int(agent_input["past_high_risk_count"])
    avg_recovery_days = float(agent_input["avg_recovery_days"])
    false_alarm_rate = float(agent_input["false_alarm_rate"])
    last_action_type = str(agent_input.get("last_action_type", "NONE"))
    action_effective_rate = float(agent_input["action_effective_rate"])

    scores = {action: 0.0 for action in ACTION_TYPES}

    # Step 1. Base scores
    if risk_level == "LOW" and risk_trend != "UP":
        scores["NONE"] += 0.6

    if risk_level == "MEDIUM":
        scores["ENCOURAGE_MESSAGE"] += 0.4
    if risk_trend == "UP":
        scores["ENCOURAGE_MESSAGE"] += 0.2
    if risk_type == "achievement_decline":
        scores["ENCOURAGE_MESSAGE"] += 0.2

    if risk_level == "HIGH":
        scores["ALERT_MENTOR"] += 0.5
    if risk_trend == "UP":
        scores["ALERT_MENTOR"] += 0.3
    if consecutive_risk_days >= 3:
        scores["ALERT_MENTOR"] += 0.2

    if risk_level == "HIGH" and risk_trend == "UP":
        scores["REQUEST_MEETING"] += 0.5
    if consecutive_risk_days >= 5:
        scores["REQUEST_MEETING"] += 0.3
    if past_high_risk_count >= 3:
        scores["REQUEST_MEETING"] += 0.2
    if risk_type in {"composite_risk", "adaptation_breakdown"}:
        scores["REQUEST_MEETING"] += 0.1

    if process_risk_score >= 0.85:
        scores["EMERGENCY"] += 0.6
    if consecutive_risk_days >= 7:
        scores["EMERGENCY"] += 0.3
    if risk_trend == "UP":
        scores["EMERGENCY"] += 0.2

    # Step 2. Adjustments
    if false_alarm_rate >= 0.7:
        # 오탐이 70% 이상 → 자연스러운 패턴으로 간주
        scores["ALERT_MENTOR"] -= 0.5
        scores["REQUEST_MEETING"] -= 0.5
        scores["EMERGENCY"] -= 0.7
        scores["ENCOURAGE_MESSAGE"] += 0.2
    elif false_alarm_rate >= 0.4:
        # 오탐이 40% 이상 → 개입 점수 차감
        scores["ALERT_MENTOR"] -= 0.3
        scores["REQUEST_MEETING"] -= 0.3
        scores["EMERGENCY"] -= 0.4

    # 행동 상한선: false_alarm_rate가 높으면 EMERGENCY 차단
    if false_alarm_rate >= 0.5:
        scores["EMERGENCY"] = min(scores["EMERGENCY"], scores["ALERT_MENTOR"] - 0.01)

    if avg_recovery_days <= 3.0 and past_high_risk_count > 0:
        scores["REQUEST_MEETING"] -= 0.1
        scores["EMERGENCY"] -= 0.1

    if action_effective_rate >= 0.7:
        scores[last_action_type] = scores.get(last_action_type, 0) + 0.15

    if interview_risk_score >= 0.7:
        scores["ALERT_MENTOR"] += 0.1
        scores["REQUEST_MEETING"] += 0.1

    return {k: _clamp_score(v) for k, v in scores.items()}


def _select_action(action_scores: dict[str, float]) -> str:
    max_score = max(action_scores.values())
    tied_actions = [k for k, v in action_scores.items() if v == max_score]

    for action in TIE_BREAK_ORDER:
        if action in tied_actions:
            return action
    return "NONE"


def _get_priority(process_risk_score: float) -> str:
    if process_risk_score >= 0.67:
        return "HIGH"
    if process_risk_score >= 0.34:
        return "MEDIUM"
    return "LOW"


def decide(agent_input: dict) -> dict:
    required_fields = {
        "process_risk_score",
        "risk_level",
        "risk_trend",
        "consecutive_risk_days",
        "state_summary",
        "risk_reason",
        "risk_type",
        "past_high_risk_count",
        "avg_recovery_days",
        "false_alarm_rate",
        "action_effective_rate",
    }
    missing = required_fields.difference(agent_input.keys())
    if missing:
        raise ValueError(f"Missing required fields: {sorted(missing)}")

    action_scores = _build_action_scores(agent_input)
    action_type = _select_action(action_scores)
    priority = _get_priority(float(agent_input["process_risk_score"]))

    risk_level = str(agent_input["risk_level"])
    risk_trend = str(agent_input["risk_trend"])
    risk_type = str(agent_input["risk_type"])
    action_reason = f"{risk_level} 위험 / {risk_trend} 추세 / {risk_type} → {action_type} 결정"

    if action_type not in ACTION_TYPES:
        raise ValueError(f"Invalid action_type generated: {action_type}")

    return {
        "action_type": action_type,
        "priority": priority,
        "action_reason": action_reason,
    }


if __name__ == "__main__":
    case1 = {
        "interview_risk_score": 0.2,
        "process_risk_score": 0.2,
        "risk_level": "LOW",
        "risk_trend": "STABLE",
        "consecutive_risk_days": 0,
        "state_summary": "안정",
        "risk_reason": "이상 없음",
        "risk_type": "achievement_decline",
        "past_high_risk_count": 0,
        "avg_recovery_days": 0.0,
        "false_alarm_rate": 0.0,
        "last_action_type": "NONE",
        "action_effective_rate": 0.0,
    }

    case2 = {
        "interview_risk_score": 0.75,
        "process_risk_score": 0.82,
        "risk_level": "HIGH",
        "risk_trend": "UP",
        "consecutive_risk_days": 6,
        "state_summary": "위험",
        "risk_reason": "복합 위험",
        "risk_type": "composite_risk",
        "past_high_risk_count": 4,
        "avg_recovery_days": 7.0,
        "false_alarm_rate": 0.1,
        "last_action_type": "ALERT_MENTOR",
        "action_effective_rate": 0.6,
    }

    case3 = {
        "interview_risk_score": 0.5,
        "process_risk_score": 0.68,
        "risk_level": "HIGH",
        "risk_trend": "UP",
        "consecutive_risk_days": 4,
        "state_summary": "주의",
        "risk_reason": "적응 문제",
        "risk_type": "adaptation_breakdown",
        "past_high_risk_count": 2,
        "avg_recovery_days": 2.0,
        "false_alarm_rate": 0.6,
        "last_action_type": "REQUEST_MEETING",
        "action_effective_rate": 0.3,
    }

    result1 = decide(case1)
    result2 = decide(case2)
    result3 = decide(case3)

    print("Case1:", result1)
    print("Case2:", result2)
    print("Case3:", result3)

    assert result1["action_type"] == "NONE"
    assert result2["action_type"] in {"REQUEST_MEETING", "EMERGENCY"}
    assert (
        INTERVENTION_STRENGTH[result3["action_type"]]
        < INTERVENTION_STRENGTH[result2["action_type"]]
    )
