from __future__ import annotations

from sqlalchemy.orm import Session

from backend.repositories import consulting_repository


def complete_care(
    session: Session,
    student_id: str,
    mentor_feedback: str | None = None,
    action_effective: int | None = None,
) -> dict:
    feedback = consulting_repository.create_feedback(
        session,
        student_id=student_id,
        mentor_feedback=mentor_feedback,
        action_effective=action_effective,
    )
    # Mark the latest pending intervention as completed so it disappears from alerts
    consulting_repository.mark_intervention_completed(session, student_id)
    session.commit()
    return {"feedback_id": feedback.feedback_id}
