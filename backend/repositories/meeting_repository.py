from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import Meeting


def create_meeting(
    session: Session,
    student_id: str,
    mentor_id: str,
    mentor_name: str,
    student_name: str,
    purpose: str,
    message: str,
    proposed_slots: list,
) -> Meeting:
    row = Meeting(
        student_id=student_id,
        mentor_id=mentor_id,
        mentor_name=mentor_name,
        student_name=student_name,
        purpose=purpose,
        message=message or "",
        proposed_slots=proposed_slots,
    )
    session.add(row)
    session.flush()
    return row


def get_meeting(session: Session, meeting_id: int) -> Meeting | None:
    return session.get(Meeting, meeting_id)


def get_meetings_for_student(session: Session, student_id: str) -> list[Meeting]:
    stmt = (
        select(Meeting)
        .where(Meeting.student_id == student_id)
        .order_by(Meeting.created_at.desc())
    )
    return list(session.scalars(stmt).all())


def get_meetings_for_mentor(session: Session, mentor_id: str) -> list[Meeting]:
    stmt = (
        select(Meeting)
        .where(Meeting.mentor_id == mentor_id)
        .order_by(Meeting.created_at.desc())
    )
    return list(session.scalars(stmt).all())


def update_selected_slots(session: Session, meeting_id: int, selected_slots: list) -> Meeting | None:
    row = get_meeting(session, meeting_id)
    if row is None:
        return None
    row.selected_slots = selected_slots
    row.status = "availability_submitted"
    row.student_notified = 1
    row.mentor_notified = 0
    return row


def confirm_slot(session: Session, meeting_id: int, confirmed_slot: dict) -> Meeting | None:
    row = get_meeting(session, meeting_id)
    if row is None:
        return None
    row.confirmed_slot = confirmed_slot
    row.status = "confirmed"
    row.student_notified = 0
    row.mentor_notified = 1
    return row
