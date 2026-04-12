from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sqlalchemy.orm import Session

from AI.predict.interview_ml_predictor import predict_interview
from backend.repositories import interview_repository


@dataclass
class InterviewSubmitInput:
    student_id: str
    achievement_score: int
    achievement_problem_solving: int
    achievement_self_learning: int
    achievement_process_clarity: int
    adaptation_score: int
    adaptation_accepts_difficulty: int
    adaptation_persistence: int
    adaptation_strategy_variety: int
    relationship_score: int
    relationship_collaboration: int
    relationship_conflict_handling: int
    relationship_help_exchange: int
    note: str | None


def _build_feature_dict(payload: InterviewSubmitInput) -> dict:
    ach_sub = (
        payload.achievement_problem_solving
        + payload.achievement_self_learning
        + payload.achievement_process_clarity
    ) / 3.0
    adp_sub = (
        payload.adaptation_accepts_difficulty
        + payload.adaptation_persistence
        + payload.adaptation_strategy_variety
    ) / 3.0
    rel_sub = (
        payload.relationship_collaboration
        + payload.relationship_conflict_handling
        + payload.relationship_help_exchange
    ) / 3.0
    overall = (
        payload.achievement_score + payload.adaptation_score + payload.relationship_score
    ) / 3.0
    three = np.array(
        [
            float(payload.achievement_score),
            float(payload.adaptation_score),
            float(payload.relationship_score),
        ],
        dtype=float,
    )
    balance = float(np.std(three, ddof=0))

    return {
        "achievement_score": payload.achievement_score,
        "achievement_problem_solving": payload.achievement_problem_solving,
        "achievement_self_learning": payload.achievement_self_learning,
        "achievement_process_clarity": payload.achievement_process_clarity,
        "adaptation_score": payload.adaptation_score,
        "adaptation_accepts_difficulty": payload.adaptation_accepts_difficulty,
        "adaptation_persistence": payload.adaptation_persistence,
        "adaptation_strategy_variety": payload.adaptation_strategy_variety,
        "relationship_score": payload.relationship_score,
        "relationship_collaboration": payload.relationship_collaboration,
        "relationship_conflict_handling": payload.relationship_conflict_handling,
        "relationship_help_exchange": payload.relationship_help_exchange,
        "achievement_sub_mean": ach_sub,
        "adaptation_sub_mean": adp_sub,
        "relationship_sub_mean": rel_sub,
        "overall_interview_mean": overall,
        "interview_balance_score": balance,
    }


def submit_interview(session: Session, payload: InterviewSubmitInput) -> dict:
    interview_id = interview_repository.save_interview_assessment(
        session,
        student_id=payload.student_id,
        achievement_score=payload.achievement_score,
        achievement_problem_solving=payload.achievement_problem_solving,
        achievement_self_learning=payload.achievement_self_learning,
        achievement_process_clarity=payload.achievement_process_clarity,
        adaptation_score=payload.adaptation_score,
        adaptation_accepts_difficulty=payload.adaptation_accepts_difficulty,
        adaptation_persistence=payload.adaptation_persistence,
        adaptation_strategy_variety=payload.adaptation_strategy_variety,
        relationship_score=payload.relationship_score,
        relationship_collaboration=payload.relationship_collaboration,
        relationship_conflict_handling=payload.relationship_conflict_handling,
        relationship_help_exchange=payload.relationship_help_exchange,
        note=payload.note,
    )

    features = _build_feature_dict(payload)
    ml_result = predict_interview(features)

    interview_repository.save_interview_risk_history(
        session,
        student_id=payload.student_id,
        interview_id=interview_id,
        result=ml_result,
    )

    session.commit()

    return {
        "student_id": payload.student_id,
        "interview_id": interview_id,
        "dropout_risk_score": ml_result["dropout_risk_score"],
        "dropout_risk_level": ml_result["dropout_risk_level"],
    }
