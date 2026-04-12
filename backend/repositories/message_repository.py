from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.orm import Session

from backend.models import InterventionHistory


def create_encourage_message(
    session: Session,
    student_id: str,
    message: str,
    mentor_id: str | None = None,
) -> InterventionHistory:
    today = date.today().isoformat()
    row = InterventionHistory(
        student_id=student_id,
        date=today,
        action_type="ENCOURAGE_MESSAGE",
        priority="LOW",
        action_reason=f"멘토({mentor_id or '알 수 없음'}) 격려 메시지 전송",
        llm_summary=message,
        status="COMPLETED",
        created_at=datetime.utcnow(),
    )
    session.add(row)
    return row
