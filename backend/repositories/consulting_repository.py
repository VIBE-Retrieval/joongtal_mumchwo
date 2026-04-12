from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import InterventionFeedback, InterventionHistory


def create_feedback(
    session: Session,
    student_id: str,
    mentor_feedback: str | None = None,
    action_effective: int | None = None,
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
