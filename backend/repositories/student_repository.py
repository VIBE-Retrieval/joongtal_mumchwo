from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import DailySurvey, InterventionHistory, InterviewRiskHistory, ProcessRiskHistory


def get_latest_process_risk(session: Session, student_id: str) -> ProcessRiskHistory | None:
    stmt = (
        select(ProcessRiskHistory)
        .where(ProcessRiskHistory.student_id == student_id)
        .order_by(ProcessRiskHistory.date.desc(), ProcessRiskHistory.id.desc())
        .limit(1)
    )
    return session.scalar(stmt)


def get_intervention_llm_summary_for_date(
    session: Session,
    student_id: str,
    day: date,
) -> str | None:
    d_str = day.isoformat()
    stmt = (
        select(InterventionHistory.llm_summary)
        .where(
            InterventionHistory.student_id == student_id,
            InterventionHistory.date == d_str,
        )
        .order_by(InterventionHistory.created_at.desc())
        .limit(1)
    )
    return session.scalar(stmt)


def get_latest_interview_risk(session: Session, student_id: str) -> InterviewRiskHistory | None:
    stmt = (
        select(InterviewRiskHistory)
        .where(InterviewRiskHistory.student_id == student_id)
        .order_by(InterviewRiskHistory.created_at.desc(), InterviewRiskHistory.id.desc())
        .limit(1)
    )
    return session.scalar(stmt)


def get_latest_intervention(session: Session, student_id: str) -> InterventionHistory | None:
    stmt = (
        select(InterventionHistory)
        .where(InterventionHistory.student_id == student_id)
        .order_by(InterventionHistory.created_at.desc(), InterventionHistory.intervention_id.desc())
        .limit(1)
    )
    return session.scalar(stmt)


def get_daily_surveys_recent_7_days(
    session: Session,
    student_id: str,
    *,
    end_date: date,
) -> list[DailySurvey]:
    start = end_date - timedelta(days=6)
    stmt = (
        select(DailySurvey)
        .where(
            DailySurvey.student_id == student_id,
            DailySurvey.survey_date >= start,
            DailySurvey.survey_date <= end_date,
        )
        .order_by(DailySurvey.survey_date.asc())
    )
    return list(session.scalars(stmt).all())
