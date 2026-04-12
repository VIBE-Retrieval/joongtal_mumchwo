from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any


_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from anthropic import Anthropic
except Exception:  # pragma: no cover - environment-dependent import
    Anthropic = None


MODEL_NAME = "claude-haiku-4-5-20251001"
ALLOWED_RISK_TYPES = {
    "achievement_decline",
    "adaptation_breakdown",
    "relationship_isolation",
    "composite_risk",
}
FALLBACK_RESULT = {
    "state_summary": "상태 해석 불가",
    "risk_reason": "데이터 부족",
    "risk_type": "composite_risk",
}


def _build_system_prompt() -> str:
    return (
        "당신은 교육 훈련생의 위험 상태를 해석하는 전문가입니다.\n"
        "주어진 수치 데이터를 바탕으로 현재 상태를 설명하세요.\n\n"
        "규칙:\n"
        "- 수치를 다시 계산하지 마세요\n"
        "- 판단(개입 여부)을 내리지 마세요\n"
        "- 반드시 아래 JSON 형식으로만 응답하세요"
    )


def _build_user_prompt(ml_result: dict[str, Any]) -> str:
    snapshot = ml_result["feature_snapshot"]
    return (
        "아래 수치 기반으로 훈련생 상태를 해석하세요.\n\n"
        f"위험 점수: {ml_result['risk_score']}\n"
        f"위험 수준: {ml_result['risk_level']}\n"
        f"위험 추세: {ml_result['risk_trend']}\n"
        f"성취도 7일 평균: {snapshot['achievement_mean_7d']}\n"
        f"적응도 7일 평균: {snapshot['adaptation_mean_7d']}\n"
        f"인간관계 7일 평균: {snapshot['relationship_mean_7d']}\n"
        f"7일 변화량: {snapshot['total_delta_7d']}\n\n"
        "응답 형식 (JSON만):\n"
        "{\n"
        '  "state_summary": "...",\n'
        '  "risk_reason": "...",\n'
        '  "risk_type": "achievement_decline | adaptation_breakdown | relationship_isolation | composite_risk 중 하나"\n'
        "}"
    )


def _extract_json_block(text: str) -> str | None:
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    return match.group(0)


def _validate_and_normalize_result(data: dict[str, Any]) -> dict[str, str]:
    state_summary = str(data.get("state_summary", "")).strip()
    risk_reason = str(data.get("risk_reason", "")).strip()
    risk_type = str(data.get("risk_type", "")).strip()

    if not state_summary or not risk_reason:
        return FALLBACK_RESULT.copy()
    if risk_type not in ALLOWED_RISK_TYPES:
        return FALLBACK_RESULT.copy()

    return {
        "state_summary": state_summary,
        "risk_reason": risk_reason,
        "risk_type": risk_type,
    }


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    if Anthropic is None:
        raise RuntimeError("anthropic package is not installed.")

    api_key = os.environ["ANTHROPIC_API_KEY"]
    client = Anthropic(api_key=api_key)
    resp = client.messages.create(
        model=MODEL_NAME,
        max_tokens=300,
        temperature=0,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    parts = []
    for item in resp.content:
        if getattr(item, "type", None) == "text":
            parts.append(item.text)
    return "\n".join(parts).strip()


def interpret(ml_result: dict) -> dict:
    try:
        required_top = {"risk_score", "risk_level", "risk_trend", "feature_snapshot"}
        if not required_top.issubset(ml_result.keys()):
            return FALLBACK_RESULT.copy()

        feature_snapshot = ml_result.get("feature_snapshot", {})
        required_features = {
            "achievement_mean_7d",
            "adaptation_mean_7d",
            "relationship_mean_7d",
            "total_delta_7d",
        }
        if not isinstance(feature_snapshot, dict) or not required_features.issubset(
            feature_snapshot.keys()
        ):
            return FALLBACK_RESULT.copy()

        system_prompt = _build_system_prompt()
        user_prompt = _build_user_prompt(ml_result)

        raw_text = _call_llm(system_prompt, user_prompt)
        json_text = _extract_json_block(raw_text)
        if not json_text:
            return FALLBACK_RESULT.copy()

        parsed = json.loads(json_text)
        if not isinstance(parsed, dict):
            return FALLBACK_RESULT.copy()

        return _validate_and_normalize_result(parsed)
    except Exception:
        return FALLBACK_RESULT.copy()


if __name__ == "__main__":
    ml_result = {
        "risk_score": 0.75,
        "risk_level": "HIGH",
        "risk_trend": "UP",
        "feature_snapshot": {
            "achievement_mean_7d": 1.8,
            "adaptation_mean_7d": 2.0,
            "relationship_mean_7d": 2.2,
            "total_delta_7d": -1.1,
        },
    }
    result = interpret(ml_result)
    print(result)

    assert result["risk_type"] in ALLOWED_RISK_TYPES
    assert bool(result["state_summary"].strip())
    assert bool(result["risk_reason"].strip())
