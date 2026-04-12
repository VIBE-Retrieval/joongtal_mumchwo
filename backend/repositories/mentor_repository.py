from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.models import InterventionHistory, ProcessRiskHistory, Student


def get_latest_process_risk_per_student(session: Session) -> list[ProcessRiskHistory]:
    sub = (
        select(
            ProcessRiskHistory.student_id.label("sid"),
            func.max(ProcessRiskHistory.date).label("max_date"),
        )
        .group_by(ProcessRiskHistory.student_id)
    ).subquery()

    stmt = select(ProcessRiskHistory).join(
        sub,
        (ProcessRiskHistory.student_id == sub.c.sid)
        & (ProcessRiskHistory.date == sub.c.max_date),
    )
    return list(session.scalars(stmt).all())


def get_latest_intervention_by_student(session: Session) -> dict[str, InterventionHistory]:
    sub = (
        select(
            InterventionHistory.student_id.label("sid"),
            func.max(InterventionHistory.created_at).label("max_created"),
        )
        .group_by(InterventionHistory.student_id)
    ).subquery()

    stmt = select(InterventionHistory).join(
        sub,
        (InterventionHistory.student_id == sub.c.sid)
        & (InterventionHistory.created_at == sub.c.max_created),
    )
    rows = session.scalars(stmt).all()
    return {r.student_id: r for r in rows}


def get_pending_non_none_alerts(session: Session) -> list[InterventionHistory]:
    stmt = (
        select(InterventionHistory)
        .where(
            InterventionHistory.status == "PENDING",
            InterventionHistory.action_type != "NONE",
        )
        .order_by(InterventionHistory.created_at.desc())
    )
    return list(session.scalars(stmt).all())


def get_student_names_by_ids(session: Session, student_ids: list[str]) -> dict[str, str]:
    if not student_ids:
        return {}
    stmt = select(Student.student_id, Student.name).where(
        Student.student_id.in_(student_ids)
    )
    rows = session.execute(stmt).all()
    return {row.student_id: row.name for row in rows}
