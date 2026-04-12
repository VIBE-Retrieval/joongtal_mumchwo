from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import Interviewer, Mentor, Student


def find_by_email_and_birth_date(
    db: Session,
    email: str,
    birth_date: str,
    role: str,
) -> dict | None:
    if role == "student":
        stmt = select(Student).where(
            Student.email == email,
            Student.birth_date == birth_date,
        )
        row = db.scalar(stmt)
        if row is None:
            return None
        return {"id": row.student_id, "name": row.name, "role": role}

    if role == "mentor":
        stmt = select(Mentor).where(
            Mentor.email == email,
            Mentor.birth_date == birth_date,
        )
        row = db.scalar(stmt)
        if row is None:
            return None
        return {"id": row.mentor_id, "name": row.name, "role": role}

    if role == "interviewer":
        stmt = select(Interviewer).where(
            Interviewer.email == email,
            Interviewer.birth_date == birth_date,
        )
        row = db.scalar(stmt)
        if row is None:
            return None
        return {"id": row.interviewer_id, "name": row.name, "role": role}

    return None
