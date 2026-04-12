from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from AI.utils.risk_utils import get_risk_level
from backend.repositories import student_repository


def get_process_risk(session: Session, student_id: str) -> dict | None:
    row = student_repository.get_latest_process_risk(session, student_id)
    if row is None:
        return None
    summary = student_repository.get_intervention_llm_summary_for_date(
        session, student_id, row.date
    )
    return {
        "student_id": student_id,
        "date": row.date.isoformat(),
        "risk_score": row.risk_score,
        "risk_level": row.risk_level,
        "risk_trend": row.risk_trend,
        "state_summary": summary,
    }


def get_interview_risk(session: Session, student_id: str) -> dict | None:
    row = student_repository.get_latest_interview_risk(session, student_id)
    if row is None:
        return None
    score = float(row.dropout_risk_score)
    return {
        "student_id": student_id,
        "dropout_risk_score": score,
        "dropout_risk_level": get_risk_level(score),
    }


def get_latest_analysis(session: Session, student_id: str) -> dict:
    iv = student_repository.get_latest_interview_risk(session, student_id)
    pr = student_repository.get_latest_process_risk(session, student_id)
    inv = student_repository.get_latest_intervention(session, student_id)

    interview_risk = None
    if iv is not None:
        s = float(iv.dropout_risk_score)
        interview_risk = {"score": s, "level": get_risk_level(s)}

    process_risk = None
    if pr is not None:
        process_risk = {
            "score": pr.risk_score,
            "level": pr.risk_level,
            "trend": pr.risk_trend,
        }

    llm_summary = inv.llm_summary if inv is not None else None
    agent_action = None
    if inv is not None:
        agent_action = {
            "action_type": inv.action_type,
            "priority": inv.priority,
            "action_reason": inv.action_reason,
        }

    return {
        "student_id": student_id,
        "interview_risk": interview_risk,
        "process_risk": process_risk,
        "llm_summary": llm_summary,
        "agent_action": agent_action,
    }


def get_progress(session: Session, student_id: str) -> dict:
    end = date.today()
    surveys = student_repository.get_daily_surveys_recent_7_days(
        session, student_id, end_date=end
    )
    history = [
        {
            "survey_date": s.survey_date.isoformat(),
            "achievement_score": s.achievement_score,
            "adaptation_score": s.adaptation_score,
            "relationship_score": s.relationship_score,
        }
        for s in surveys
    ]

    pr = student_repository.get_latest_process_risk(session, student_id)
    if pr is None:
        emotion_state, emotion_label = "보통", "😐"
    elif pr.risk_level == "HIGH" and pr.risk_trend == "UP":
        emotion_state, emotion_label = "주의", "😟"
    elif pr.risk_level == "MEDIUM":
        emotion_state, emotion_label = "보통", "😐"
    elif pr.risk_level == "LOW":
        emotion_state, emotion_label = "안정", "🙂"
    else:
        emotion_state, emotion_label = "보통", "😐"

    return {
        "student_id": student_id,
        "history": history,
        "emotion_state": emotion_state,
        "emotion_label": emotion_label,
    }
