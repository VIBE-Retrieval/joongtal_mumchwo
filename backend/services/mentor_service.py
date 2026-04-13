from __future__ import annotations

from sqlalchemy.orm import Session

from AI.utils.risk_utils import get_risk_level
from backend.repositories import mentor_repository

_LEVEL_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
_PRIORITY_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}


def list_student_risks(session: Session) -> dict:
    rows = mentor_repository.get_all_students_with_risk(session)
    latest_inv = mentor_repository.get_latest_intervention_by_student(session)

    items = []
    for row in rows:
        sid = row["student_id"]
        inv = latest_inv.get(sid)
        recommended = inv.action_type if inv is not None else "NONE"

        if row["process_risk_score"] is not None:
            risk_score = row["process_risk_score"]
            risk_level = row["process_risk_level"]
            risk_trend = row["process_risk_trend"]
        elif row["interview_risk_score"] is not None:
            risk_score = float(row["interview_risk_score"])
            risk_level = get_risk_level(risk_score)
            risk_trend = "STABLE"
        else:
            risk_score = 0.0
            risk_level = "LOW"
            risk_trend = "STABLE"

        inv_status = inv.status if inv is not None else None
        inv_action = inv.action_type if inv is not None else "NONE"
        is_pending = inv_status == "PENDING"
        care_needed = is_pending and inv_action not in ("NONE", "")
        new_risk_today = is_pending and inv_action in (
            "EMERGENCY",
            "ALERT_MENTOR",
            "REQUEST_MEETING",
        )

        items.append(
            {
                "student_id": sid,
                "student_name": row["name"] or sid,
                "birth_date": row["birth_date"],
                "phone": row["phone"],
                "email": row["email"],
                "course_name": row["course_name"],
                "education_level": row.get("education_level") or "기타",
                "created_at": row.get("created_at", ""),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "risk_trend": risk_trend,
                "recommended_action": recommended,
                "risk_history": row.get("risk_history", []),
                "llm_summary": row.get("llm_summary", ""),
                "care_needed": care_needed,
                "new_risk_today": new_risk_today,
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
            "intervention_id": r.intervention_id,
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


def read_alert(session: Session, intervention_id: int) -> bool:
    return mentor_repository.mark_alert_as_read(session, intervention_id)


def read_all_alerts(session: Session) -> int:
    return mentor_repository.mark_all_alerts_as_read(session)
