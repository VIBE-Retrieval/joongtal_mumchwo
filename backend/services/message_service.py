from __future__ import annotations

from sqlalchemy.orm import Session

from backend.repositories import message_repository


def send_encouragement(
    session: Session,
    student_id: str,
    message: str,
    mentor_id: str | None = None,
) -> dict:
    row = message_repository.create_encourage_message(
        session,
        student_id=student_id,
        message=message,
        mentor_id=mentor_id,
    )
    session.commit()
    return {"message_id": row.intervention_id}
