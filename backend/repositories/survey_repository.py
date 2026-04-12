from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.models import (
    DailySurvey,
    InterventionFeedback,
    InterventionHistory,
    InterviewRiskHistory,
    ProcessRiskHistory,
    Student,
)


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


def get_past_high_risk_count(session: Session, student_id: str) -> int:
    n = session.scalar(
        select(func.count())
        .select_from(ProcessRiskHistory)
        .where(
            ProcessRiskHistory.student_id == student_id,
            ProcessRiskHistory.risk_level == "HIGH",
        )
    )
    return int(n or 0)


def get_consecutive_risk_days(session: Session, student_id: str, today: date) -> int:
    stmt = (
        select(ProcessRiskHistory.risk_level)
        .where(
            ProcessRiskHistory.student_id == student_id,
            ProcessRiskHistory.date < today,
        )
        .order_by(ProcessRiskHistory.date.desc())
    )
    levels = session.scalars(stmt).all()
    consecutive = 0
    for level in levels:
        if level == "HIGH":
            consecutive += 1
        else:
            break
    return consecutive


def get_last_action_type(session: Session, student_id: str) -> str:
    stmt = (
        select(InterventionHistory.action_type)
        .where(InterventionHistory.student_id == student_id)
        .order_by(InterventionHistory.created_at.desc())
        .limit(1)
    )
    row = session.scalar(stmt)
    return str(row) if row is not None else "NONE"


def get_feedback_stats(session: Session, student_id: str) -> dict[str, float]:
    stmt = select(InterventionFeedback).where(InterventionFeedback.student_id == student_id)
    rows = session.scalars(stmt).all()
    if not rows:
        return {
            "avg_recovery_days": 0.0,
            "false_alarm_rate": 0.0,
            "action_effective_rate": 0.0,
        }
    n = len(rows)
    recovery_vals = [r.recovery_days for r in rows if r.recovery_days is not None]
    avg_recovery = float(sum(recovery_vals) / len(recovery_vals)) if recovery_vals else 0.0
    false_n = sum(1 for r in rows if r.mentor_feedback == "false_alarm")
    effective_n = sum(1 for r in rows if r.action_effective == 1)
    return {
        "avg_recovery_days": avg_recovery,
        "false_alarm_rate": false_n / float(n),
        "action_effective_rate": effective_n / float(n),
    }


def get_latest_interview_risk_score(session: Session, student_id: str) -> float:
    stmt = (
        select(InterviewRiskHistory.dropout_risk_score)
        .where(InterviewRiskHistory.student_id == student_id)
        .order_by(InterviewRiskHistory.created_at.desc())
        .limit(1)
    )
    row = session.scalar(stmt)
    return float(row) if row is not None else 0.5


def save_intervention_history(
    session: Session,
    *,
    student_id: str,
    record_date: date,
    agent_result: dict[str, Any],
    llm_summary: str,
) -> InterventionHistory:
    ensure_student(session, student_id)
    row = InterventionHistory(
        student_id=student_id,
        date=record_date.isoformat(),
        action_type=str(agent_result["action_type"]),
        priority=str(agent_result["priority"]),
        action_reason=str(agent_result["action_reason"]),
        llm_summary=llm_summary,
        status="PENDING",
    )
    session.add(row)
    session.flush()
    return row
