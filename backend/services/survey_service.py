from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from AI.agent.agent_service import decide
from AI.llm.llm_interpreter import generate_encouragement, interpret
from backend.ai_module.process_ml_service import run_process_ml
from backend.models import Student
from backend.repositories import meeting_repository, survey_repository


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

    llm_input = {
        "risk_score": ml_result["risk_score"],
        "risk_level": ml_result["risk_level"],
        "risk_trend": ml_result["risk_trend"],
        "feature_snapshot": ml_result["feature_snapshot"],
    }
    llm_result = interpret(llm_input)

    feedback_stats = survey_repository.get_feedback_stats(session, payload.student_id)
    agent_input = {
        "interview_risk_score": survey_repository.get_latest_interview_risk_score(
            session, payload.student_id
        ),
        "process_risk_score": ml_result["risk_score"],
        "risk_level": ml_result["risk_level"],
        "risk_trend": ml_result["risk_trend"],
        "consecutive_risk_days": survey_repository.get_consecutive_risk_days(
            session, payload.student_id, payload.survey_date
        ),
        "state_summary": llm_result["state_summary"],
        "risk_reason": llm_result["risk_reason"],
        "risk_type": llm_result["risk_type"],
        "past_high_risk_count": survey_repository.get_past_high_risk_count(
            session, payload.student_id
        ),
        "avg_recovery_days": feedback_stats["avg_recovery_days"],
        "false_alarm_rate": feedback_stats["false_alarm_rate"],
        "last_action_type": survey_repository.get_last_action_type(session, payload.student_id),
        "action_effective_rate": feedback_stats["action_effective_rate"],
    }
    agent_result = decide(agent_input)

    intervention = survey_repository.save_intervention_history(
        session,
        student_id=payload.student_id,
        record_date=payload.survey_date,
        agent_result=agent_result,
        llm_summary=llm_result["state_summary"],
    )

    action_type = agent_result["action_type"]

    if action_type == "ENCOURAGE_MESSAGE":
        encourage_msg = generate_encouragement(
            {
                "risk_score": ml_result["risk_score"],
                "risk_level": ml_result["risk_level"],
                "risk_trend": ml_result["risk_trend"],
                "feature_snapshot": ml_result["feature_snapshot"],
            },
            llm_result,
        )
        intervention.llm_summary = encourage_msg
        intervention.status = "COMPLETED"

    elif action_type in ("ALERT_MENTOR", "EMERGENCY"):
        if action_type == "EMERGENCY":
            student = session.get(Student, payload.student_id)
            student_name = student.name if student else payload.student_id
            meeting_repository.create_meeting(
                session,
                student_id=payload.student_id,
                mentor_id="SYSTEM",
                mentor_name="AI 긴급 요청",
                student_name=student_name,
                purpose=f"[긴급] {agent_result['action_reason']}",
                message=llm_result["state_summary"],
                proposed_slots=[],
            )

    elif action_type == "REQUEST_MEETING":
        student = session.get(Student, payload.student_id)
        student_name = student.name if student else payload.student_id
        meeting_repository.create_meeting(
            session,
            student_id=payload.student_id,
            mentor_id="SYSTEM",
            mentor_name="AI 자동 요청",
            student_name=student_name,
            purpose=agent_result["action_reason"],
            message=llm_result["state_summary"],
            proposed_slots=[],
        )
        intervention.status = "COMPLETED"

    elif action_type == "NONE":
        intervention.status = "COMPLETED"

    session.commit()

    return {
        "student_id": payload.student_id,
        "survey_date": survey_date_str,
        "risk_score": ml_result["risk_score"],
        "risk_level": ml_result["risk_level"],
        "risk_trend": ml_result["risk_trend"],
        "feature_snapshot": ml_result["feature_snapshot"],
        "risk_reason": llm_result["risk_reason"],
        "risk_type": llm_result["risk_type"],
        "action_type": agent_result["action_type"],
        "priority": agent_result["priority"],
        "action_reason": agent_result["action_reason"],
        "state_summary": llm_result["state_summary"],
    }
