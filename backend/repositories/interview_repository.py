from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from backend.models import InterviewAssessment, InterviewRiskHistory
from backend.repositories.survey_repository import ensure_student


def save_interview_assessment(
    session: Session,
    *,
    student_id: str,
    achievement_score: int,
    achievement_problem_solving: int,
    achievement_self_learning: int,
    achievement_process_clarity: int,
    adaptation_score: int,
    adaptation_accepts_difficulty: int,
    adaptation_persistence: int,
    adaptation_strategy_variety: int,
    relationship_score: int,
    relationship_collaboration: int,
    relationship_conflict_handling: int,
    relationship_help_exchange: int,
    note: str | None,
) -> int:
    ensure_student(session, student_id)
    row = InterviewAssessment(
        student_id=student_id,
        achievement_score=achievement_score,
        achievement_problem_solving=achievement_problem_solving,
        achievement_self_learning=achievement_self_learning,
        achievement_process_clarity=achievement_process_clarity,
        adaptation_score=adaptation_score,
        adaptation_accepts_difficulty=adaptation_accepts_difficulty,
        adaptation_persistence=adaptation_persistence,
        adaptation_strategy_variety=adaptation_strategy_variety,
        relationship_score=relationship_score,
        relationship_collaboration=relationship_collaboration,
        relationship_conflict_handling=relationship_conflict_handling,
        relationship_help_exchange=relationship_help_exchange,
        note=note,
    )
    session.add(row)
    session.flush()
    return int(row.interview_id)


def save_interview_risk_history(
    session: Session,
    *,
    student_id: str,
    interview_id: int,
    result: dict[str, Any],
) -> InterviewRiskHistory:
    ensure_student(session, student_id)
    row = InterviewRiskHistory(
        student_id=student_id,
        interview_id=str(interview_id),
        dropout_risk_score=float(result["dropout_risk_score"]),
        model_version="interview_ml_v1",
    )
    session.add(row)
    session.flush()
    return row
