from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import DailySurvey, ProcessRiskHistory, Student


def ensure_student(session: Session, student_id: str) -> None:
    row = session.get(Student, student_id)
    if row is None:
        session.add(Student(student_id=student_id))
        session.flush()


def upsert_daily_survey(
    session: Session,
    *,
    student_id: str,
    survey_date: date,
    achievement_score: int,
    adaptation_score: int,
    relationship_score: int,
) -> DailySurvey:
    ensure_student(session, student_id)
    existing = session.scalar(
        select(DailySurvey).where(
            DailySurvey.student_id == student_id,
            DailySurvey.survey_date == survey_date,
        )
    )
    if existing:
        existing.achievement_score = achievement_score
        existing.adaptation_score = adaptation_score
        existing.relationship_score = relationship_score
        existing.created_at = datetime.utcnow()
        session.flush()
        return existing
    row = DailySurvey(
        student_id=student_id,
        survey_date=survey_date,
        achievement_score=achievement_score,
        adaptation_score=adaptation_score,
        relationship_score=relationship_score,
    )
    session.add(row)
    session.flush()
    return row


def get_daily_surveys_last_7_days(
    session: Session,
    *,
    student_id: str,
    end_date: date,
) -> Sequence[DailySurvey]:
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
    return session.scalars(stmt).all()


def get_recent_risk_scores_before(
    session: Session,
    *,
    student_id: str,
    before_date: date,
    limit: int = 5,
) -> list[float]:
    stmt = (
        select(ProcessRiskHistory.risk_score, ProcessRiskHistory.date)
        .where(
            ProcessRiskHistory.student_id == student_id,
            ProcessRiskHistory.date < before_date,
        )
        .order_by(ProcessRiskHistory.date.desc())
        .limit(limit)
    )
    rows = session.execute(stmt).all()
    scores = [float(r[0]) for r in reversed(rows)]
    return scores


def upsert_process_risk_history(
    session: Session,
    *,
    student_id: str,
    record_date: date,
    risk_score: float,
    risk_level: str,
    risk_trend: str,
    feature_snapshot: dict[str, Any],
    model_version: str,
) -> ProcessRiskHistory:
    ensure_student(session, student_id)
    existing = session.scalar(
        select(ProcessRiskHistory).where(
            ProcessRiskHistory.student_id == student_id,
            ProcessRiskHistory.date == record_date,
        )
    )
    if existing:
        existing.risk_score = risk_score
        existing.risk_level = risk_level
        existing.risk_trend = risk_trend
        existing.feature_snapshot = feature_snapshot
        existing.model_version = model_version
        existing.created_at = datetime.utcnow()
        session.flush()
        return existing
    row = ProcessRiskHistory(
        student_id=student_id,
        date=record_date,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_trend=risk_trend,
        feature_snapshot=feature_snapshot,
        model_version=model_version,
    )
    session.add(row)
    session.flush()
    return row
