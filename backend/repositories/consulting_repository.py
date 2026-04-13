from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from AI.utils.risk_utils import get_risk_level
from backend.models import InterventionFeedback, InterventionHistory, ProcessRiskHistory


def create_feedback(
    session: Session,
    student_id: str,
    mentor_feedback: str | None = None,
    action_effective: int | None = None,
    recovery_days: int | None = None,
) -> InterventionFeedback:
    # Find latest intervention for this student to link
    stmt = (
        select(InterventionHistory)
        .where(InterventionHistory.student_id == student_id)
        .order_by(InterventionHistory.created_at.desc())
        .limit(1)
    )
    latest_intervention = session.scalars(stmt).first()
    intervention_id = latest_intervention.intervention_id if latest_intervention else None

    feedback = InterventionFeedback(
        student_id=student_id,
        intervention_id=intervention_id,
        recovery_days=recovery_days,
        mentor_feedback=mentor_feedback,
        action_effective=action_effective,
        created_at=datetime.utcnow(),
    )
    session.add(feedback)
    return feedback


def mark_intervention_completed(session: Session, student_id: str) -> None:
    """Mark the latest PENDING intervention for a student as COMPLETED."""
    stmt = (
        select(InterventionHistory)
        .where(
            InterventionHistory.student_id == student_id,
            InterventionHistory.status == "PENDING",
        )
        .order_by(InterventionHistory.created_at.desc())
        .limit(1)
    )
    row = session.scalars(stmt).first()
    if row:
        row.status = "COMPLETED"


def insert_corrected_risk(session: Session, student_id: str) -> None:
    """Insert (or update same-day) corrected risk row for false-alarm feedback."""
    latest_stmt = (
        select(ProcessRiskHistory)
        .where(ProcessRiskHistory.student_id == student_id)
        .order_by(ProcessRiskHistory.created_at.desc())
        .limit(1)
    )
    latest = session.scalars(latest_stmt).first()
    if latest is None:
        return

    corrected_score = max(0.0, float(latest.risk_score) * 0.6)
    today = date.today()
    snapshot = latest.feature_snapshot if latest.feature_snapshot is not None else {}

    today_stmt = select(ProcessRiskHistory).where(
        ProcessRiskHistory.student_id == student_id,
        ProcessRiskHistory.date == today,
    )
    today_row = session.scalars(today_stmt).first()

    if today_row is None:
        today_row = ProcessRiskHistory(
            student_id=student_id,
            date=today,
            risk_score=corrected_score,
            risk_level=get_risk_level(corrected_score),
            risk_trend="DOWN",
            consecutive_risk_days=latest.consecutive_risk_days,
            feature_snapshot=snapshot,
            model_version="corrected_v1",
            created_at=datetime.utcnow(),
        )
        session.add(today_row)
    else:
        today_row.risk_score = corrected_score
        today_row.risk_level = get_risk_level(corrected_score)
        today_row.risk_trend = "DOWN"
        today_row.feature_snapshot = snapshot
        today_row.model_version = "corrected_v1"

    session.commit()
