from __future__ import annotations

from sqlalchemy.orm import Session

from backend.repositories import mentor_repository

_LEVEL_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
_PRIORITY_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}


def list_student_risks(session: Session) -> dict:
    rows = mentor_repository.get_latest_process_risk_per_student(session)
    latest_inv = mentor_repository.get_latest_intervention_by_student(session)

    student_ids = list({r.student_id for r in rows})
    student_names = mentor_repository.get_student_names_by_ids(session, student_ids)

    items = []
    for r in rows:
        inv = latest_inv.get(r.student_id)
        recommended = inv.action_type if inv is not None else "NONE"
        items.append(
            {
                "student_id": r.student_id,
                "student_name": student_names.get(r.student_id, r.student_id),
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "risk_trend": r.risk_trend,
                "recommended_action": recommended,
            }
        )

    items.sort(
        key=lambda x: (
            _LEVEL_RANK.get(x["risk_level"], 0),
            x["risk_score"],
        ),
        reverse=True,
    )

    return {"items": items}


def list_alerts(session: Session) -> dict:
    rows = mentor_repository.get_pending_non_none_alerts(session)
    rows.sort(
        key=lambda r: (
            _PRIORITY_RANK.get(r.priority, 0),
            r.date,
            r.intervention_id,
        ),
        reverse=True,
    )

    student_ids = list({r.student_id for r in rows})
    student_names = mentor_repository.get_student_names_by_ids(session, student_ids)

    alerts = [
        {
            "student_id": r.student_id,
            "student_name": student_names.get(r.student_id, r.student_id),
            "action_type": r.action_type,
            "priority": r.priority,
            "action_reason": r.action_reason,
            "llm_summary": r.llm_summary,
            "date": r.date,
        }
        for r in rows
    ]
    return {"alerts": alerts}
