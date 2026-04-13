from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.models import (
    InterventionHistory,
    InterviewAssessment,
    InterviewRiskHistory,
    ProcessRiskHistory,
    Student,
)


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


def _latest_interview_risk_by_student(session: Session) -> dict[str, InterviewRiskHistory]:
    sub = (
        select(
            InterviewRiskHistory.student_id.label("sid"),
            func.max(InterviewRiskHistory.created_at).label("max_created"),
        )
        .group_by(InterviewRiskHistory.student_id)
    ).subquery()

    stmt = select(InterviewRiskHistory).join(
        sub,
        (InterviewRiskHistory.student_id == sub.c.sid)
        & (InterviewRiskHistory.created_at == sub.c.max_created),
    )
    return {r.student_id: r for r in session.scalars(stmt).all()}


def _recent_risk_history_by_student(
    session: Session, student_ids: list[str], limit: int = 14
) -> dict[str, list[float]]:
    if not student_ids:
        return {}

    ranked = (
        select(
            ProcessRiskHistory.student_id.label("sid"),
            ProcessRiskHistory.date.label("risk_date"),
            ProcessRiskHistory.risk_score.label("risk_score"),
            func.row_number()
            .over(
                partition_by=ProcessRiskHistory.student_id,
                order_by=ProcessRiskHistory.date.desc(),
            )
            .label("rn"),
        )
        .where(ProcessRiskHistory.student_id.in_(student_ids))
    ).subquery()

    stmt = (
        select(ranked.c.sid, ranked.c.risk_date, ranked.c.risk_score)
        .where(ranked.c.rn <= limit)
        .order_by(ranked.c.sid.asc(), ranked.c.risk_date.asc())
    )

    history_by_sid: dict[str, list[float]] = defaultdict(list)
    for sid, _risk_date, risk_score in session.execute(stmt).all():
        history_by_sid[str(sid)].append(float(risk_score))
    return dict(history_by_sid)


def get_all_students_with_risk(session: Session) -> list[dict]:
    """
    students 전체를 기준으로 최신 process_risk / interview_risk를 LEFT JOIN 형태로 병합.
    """
    interviewed_ids = {
        student_id
        for student_id in session.scalars(
            select(InterviewAssessment.student_id).distinct()
        ).all()
    }
    if not interviewed_ids:
        return []

    students = list(
        session.scalars(
            select(Student)
            .where(Student.student_id.in_(interviewed_ids))
            .order_by(Student.created_at.desc())
        ).all()
    )
    process_by_sid: dict[str, ProcessRiskHistory] = {}
    for r in get_latest_process_risk_per_student(session):
        process_by_sid.setdefault(r.student_id, r)

    interview_by_sid = _latest_interview_risk_by_student(session)
    history_by_sid = _recent_risk_history_by_student(
        session, [s.student_id for s in students], limit=14
    )

    out: list[dict] = []
    for s in students:
        pr = process_by_sid.get(s.student_id)
        ir = interview_by_sid.get(s.student_id)
        out.append(
            {
                "student_id": s.student_id,
                "name": s.name,
                "birth_date": s.birth_date,
                "phone": s.phone,
                "email": s.email,
                "course_name": s.course_name,
                "education_level": s.education_level,
                "created_at": s.created_at.date().isoformat() if s.created_at is not None else "",
                "process_risk_score": pr.risk_score if pr is not None else None,
                "process_risk_level": pr.risk_level if pr is not None else None,
                "process_risk_trend": pr.risk_trend if pr is not None else None,
                "interview_risk_score": ir.dropout_risk_score if ir is not None else None,
                "risk_history": history_by_sid.get(s.student_id, []),
            }
        )
    return out


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
