from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

load_dotenv(_PROJECT_ROOT / ".env")

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - environment-dependent import
    OpenAI = None


MODEL_NAME = "gpt-4o-mini"
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
    if OpenAI is None:
        raise RuntimeError("openai package is not installed.")

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or api_key == "your_openai_api_key_here":
        raise RuntimeError("OPENAI_API_KEY is not set in .env")

    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=MODEL_NAME,
        max_tokens=300,
        temperature=0,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content.strip()


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


def generate_encouragement(ml_result: dict, llm_result: dict) -> str:
    fallback_message = (
        "오늘도 충분히 잘하고 있어요. 어려운 순간도 있지만, 포기하지 않는 당신을 응원합니다."
    )

    try:
        required_ml = {"risk_score", "risk_level", "risk_trend", "feature_snapshot"}
        required_llm = {"state_summary", "risk_reason", "risk_type"}
        if not required_ml.issubset(ml_result.keys()):
            return fallback_message
        if not required_llm.issubset(llm_result.keys()):
            return fallback_message

        system_prompt = (
            "당신은 교육 훈련생을 응원하는 멘토입니다.\n"
            "학생의 상태를 파악하고 따뜻한 격려 메시지를 작성하세요.\n"
            "규칙: 위험 점수나 수치를 직접 언급하지 마세요. 따뜻하고 진심 어린 톤. 2~3문장."
        )
        user_prompt = (
            "아래 정보를 바탕으로 학생에게 보낼 격려 메시지를 2~3문장으로 작성하세요.\n\n"
            f"- risk_type: {llm_result.get('risk_type', '')}\n"
            f"- state_summary: {llm_result.get('state_summary', '')}\n"
            f"- risk_reason: {llm_result.get('risk_reason', '')}\n\n"
            "출력은 JSON 없이 plain text로만 작성하세요."
        )

        text = _call_llm(system_prompt, user_prompt).strip()
        if not text:
            return fallback_message
        return text
    except Exception:
        return fallback_message


def generate_mentor_summary(agent_result: dict, llm_result: dict) -> str:
    fallback_message = "현재 학생 상태에 대한 자동 분석이 완료되었습니다."

    try:
        required_agent = {"action_type", "priority", "action_reason"}
        required_llm = {"state_summary", "risk_reason", "risk_type"}
        if not required_agent.issubset(agent_result.keys()):
            return fallback_message
        if not required_llm.issubset(llm_result.keys()):
            return fallback_message

        system_prompt = (
            "당신은 훈련생 관리 시스템의 AI 분석관입니다.\n"
            "멘토에게 학생의 현재 위험 상태와 대응 근거를 간결하게 보고하세요.\n"
            "규칙: 수치나 점수를 직접 언급하지 말고, 전문적이고 객관적인 톤으로 2~3문장으로 작성하세요."
        )
        user_prompt = (
            "아래 정보를 바탕으로 멘토용 요약 보고를 작성하세요.\n\n"
            f"- state_summary: {llm_result.get('state_summary', '')}\n"
            f"- risk_reason: {llm_result.get('risk_reason', '')}\n"
            f"- risk_type: {llm_result.get('risk_type', '')}\n"
            f"- action_type: {agent_result.get('action_type', '')}\n"
            f"- priority: {agent_result.get('priority', '')}\n"
            f"- action_reason: {agent_result.get('action_reason', '')}\n\n"
            "출력은 JSON 없이 plain text 한국어 문장으로만 작성하세요."
        )

        text = _call_llm(system_prompt, user_prompt).strip()
        if not text:
            return fallback_message
        return text
    except Exception:
        return fallback_message


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
