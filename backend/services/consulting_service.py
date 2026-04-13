from __future__ import annotations

from sqlalchemy.orm import Session

from backend.repositories import consulting_repository


def complete_care(
    session: Session,
    student_id: str,
    mentor_feedback: str | None = None,
    action_effective: int | None = None,
    is_false_alarm: bool = False,
    recovery_days: int | None = None,
    feedback_note: str | None = None,
) -> dict:
    # Keep signature aligned with controller payload.
    _ = feedback_note

    if is_false_alarm:
        mentor_feedback = "false_alarm"
        action_effective = 0
        recovery_days = None
    elif recovery_days is not None:
        mentor_feedback = "recovered"
        action_effective = 1

    feedback = consulting_repository.create_feedback(
        session,
        student_id=student_id,
        mentor_feedback=mentor_feedback,
        action_effective=action_effective,
        recovery_days=recovery_days,
    )
    # Mark the latest pending intervention as completed so it disappears from alerts
    consulting_repository.mark_intervention_completed(session, student_id)

    if is_false_alarm:
        consulting_repository.insert_corrected_risk(session, student_id)

    session.commit()
    return {"feedback_id": feedback.feedback_id}
