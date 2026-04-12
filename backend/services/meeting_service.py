from __future__ import annotations

from sqlalchemy.orm import Session

from backend.models import Meeting
from backend.repositories import meeting_repository


def _serialize(m: Meeting) -> dict:
    return {
        "meeting_id": m.meeting_id,
        "student_id": m.student_id,
        "mentor_id": m.mentor_id,
        "mentor_name": m.mentor_name,
        "student_name": m.student_name,
        "purpose": m.purpose,
        "message": m.message,
        "status": m.status,
        "proposed_slots": m.proposed_slots,
        "selected_slots": m.selected_slots,
        "confirmed_slot": m.confirmed_slot,
        "student_notified": bool(m.student_notified),
        "mentor_notified": bool(m.mentor_notified),
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def create_meeting(
    session: Session,
    student_id: str,
    mentor_id: str,
    mentor_name: str,
    student_name: str,
    purpose: str,
    message: str,
    proposed_slots: list,
) -> dict:
    row = meeting_repository.create_meeting(
        session,
        student_id=student_id,
        mentor_id=mentor_id,
        mentor_name=mentor_name,
        student_name=student_name,
        purpose=purpose,
        message=message,
        proposed_slots=proposed_slots,
    )
    session.commit()
    return {"meeting_id": row.meeting_id}


def submit_slots(session: Session, meeting_id: int, selected_slots: list) -> dict:
    row = meeting_repository.update_selected_slots(session, meeting_id, selected_slots)
    if row is None:
        raise ValueError("meeting not found")
    session.commit()
    return _serialize(row)


def confirm_slot(session: Session, meeting_id: int, confirmed_slot: dict) -> dict:
    row = meeting_repository.confirm_slot(session, meeting_id, confirmed_slot)
    if row is None:
        raise ValueError("meeting not found")
    session.commit()
    return _serialize(row)


def get_meetings_for_student(session: Session, student_id: str) -> dict:
    rows = meeting_repository.get_meetings_for_student(session, student_id)
    return {"meetings": [_serialize(m) for m in rows]}


def get_meetings_for_mentor(session: Session, mentor_id: str) -> dict:
    rows = meeting_repository.get_meetings_for_mentor(session, mentor_id)
    return {"meetings": [_serialize(m) for m in rows]}
