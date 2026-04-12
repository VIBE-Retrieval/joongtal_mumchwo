from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from backend.ai_module.process_ml_service import run_process_ml
from backend.repositories import survey_repository


@dataclass
class DailySurveyInput:
    student_id: str
    survey_date: date
    achievement_score: int
    adaptation_score: int
    relationship_score: int


def submit_daily_survey(session: Session, payload: DailySurveyInput) -> dict:
    survey_repository.upsert_daily_survey(
        session,
        student_id=payload.student_id,
        survey_date=payload.survey_date,
        achievement_score=payload.achievement_score,
        adaptation_score=payload.adaptation_score,
        relationship_score=payload.relationship_score,
    )

    rows = survey_repository.get_daily_surveys_last_7_days(
        session,
        student_id=payload.student_id,
        end_date=payload.survey_date,
    )
    surveys_window = [
        {
            "survey_date": r.survey_date.isoformat(),
            "achievement_score": r.achievement_score,
            "adaptation_score": r.adaptation_score,
            "relationship_score": r.relationship_score,
        }
        for r in rows
    ]

    past_scores = survey_repository.get_recent_risk_scores_before(
        session,
        student_id=payload.student_id,
        before_date=payload.survey_date,
        limit=5,
    )

    survey_date_str = payload.survey_date.isoformat()
    ml_result = run_process_ml(
        student_id=payload.student_id,
        survey_date=survey_date_str,
        surveys_window=surveys_window,
        past_risk_scores=past_scores,
    )

    survey_repository.upsert_process_risk_history(
        session,
        student_id=payload.student_id,
        record_date=payload.survey_date,
        risk_score=ml_result["risk_score"],
        risk_level=ml_result["risk_level"],
        risk_trend=ml_result["risk_trend"],
        feature_snapshot=ml_result["feature_snapshot"],
        model_version="process_ml_v1",
    )

    session.commit()

    return {
        "student_id": payload.student_id,
        "survey_date": survey_date_str,
        "risk_score": ml_result["risk_score"],
        "risk_level": ml_result["risk_level"],
        "risk_trend": ml_result["risk_trend"],
    }
