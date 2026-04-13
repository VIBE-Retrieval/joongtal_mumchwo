from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy.orm import Session

from AI.utils.risk_utils import get_risk_level
from backend.repositories import student_repository

DEFAULT_CARE_MESSAGE = "오늘도 충분히 잘하고 있어요. 천천히 나아가도 괜찮습니다."


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


def get_care_message(session: Session, student_id: str) -> dict:
    row = student_repository.get_latest_encourage_message(session, student_id)
    if row is not None:
        return {
            "student_id": student_id,
            "message": row.llm_summary,
            "has_message": True,
        }
    return {
        "student_id": student_id,
        "message": DEFAULT_CARE_MESSAGE,
        "has_message": False,
    }


def list_students(session: Session) -> dict:
    rows = student_repository.get_all_students(session)
    return {
        "students": [
            {
                "student_id": row["student"].student_id,
                "name": row["student"].name,
                "email": row["student"].email,
                "birth_date": row["student"].birth_date,
                "phone": row["student"].phone,
                "course_name": row["student"].course_name,
                "education_level": row["student"].education_level or "기타",
                "created_at": row["student"].created_at.isoformat(),
                "has_interview": row["has_interview"],
            }
            for row in rows
        ]
    }


def delete_student(session: Session, student_id: str) -> bool:
    deleted = student_repository.delete_student(session, student_id)
    if deleted:
        session.commit()
    return deleted


def register_student(
    session: Session,
    name: str,
    email: str,
    birth_date: str,
    phone: str | None = None,
    course_name: str | None = None,
    education_level: str = "기타",
) -> dict:
    existing = student_repository.get_student_by_email(session, email)
    if existing:
        raise ValueError("이미 등록된 이메일입니다.")

    student_id = "STU-" + uuid.uuid4().hex[:8].upper()
    student = student_repository.create_student(
        session,
        student_id,
        name,
        email,
        birth_date,
        phone=phone,
        course_name=course_name,
        education_level=education_level,
    )
    session.commit()
    return {"student_id": student.student_id}
