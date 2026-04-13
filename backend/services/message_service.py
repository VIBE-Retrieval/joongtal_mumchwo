from __future__ import annotations

import re

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


def _parse_mentor_id(action_reason: str) -> str | None:
    # Expected shape example: "멘토(<mentor_id>) 격려 메시지 전송"
    m = re.search(r"\(([^)]+)\)", action_reason or "")
    if not m:
        return None
    value = m.group(1).strip()
    if value in {"", "알 수 없음", "?????놁쓬", "None", "null"}:
        return None
    return value


def get_messages(session: Session, student_id: str) -> dict:
    rows = message_repository.get_encourage_messages(session, student_id)
    return {
        "messages": [
            {
                "message_id": str(row.intervention_id),
                "student_id": row.student_id,
                "message": row.llm_summary,
                "mentor_id": _parse_mentor_id(row.action_reason),
                "mentor_name": "멘토",
                "sent_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    }
