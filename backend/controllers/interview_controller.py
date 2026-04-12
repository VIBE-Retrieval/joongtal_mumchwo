from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.interview_service import InterviewSubmitInput, submit_interview

router = APIRouter(prefix="/interviews", tags=["interviews"])


class InterviewBody(BaseModel):
    student_id: str = Field(min_length=1)
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
    note: str | None = None

    @field_validator("student_id")
    @classmethod
    def student_id_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("student_id required")
        return s

    @field_validator(
        "achievement_score",
        "achievement_problem_solving",
        "achievement_self_learning",
        "achievement_process_clarity",
        "adaptation_score",
        "adaptation_accepts_difficulty",
        "adaptation_persistence",
        "adaptation_strategy_variety",
        "relationship_score",
        "relationship_collaboration",
        "relationship_conflict_handling",
        "relationship_help_exchange",
    )
    @classmethod
    def score_range(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("score must be 1..5")
        return v


@router.post("")
def post_interview(body: InterviewBody, db: Session = Depends(get_db)):
    try:
        payload = InterviewSubmitInput(
            student_id=body.student_id,
            achievement_score=body.achievement_score,
            achievement_problem_solving=body.achievement_problem_solving,
            achievement_self_learning=body.achievement_self_learning,
            achievement_process_clarity=body.achievement_process_clarity,
            adaptation_score=body.adaptation_score,
            adaptation_accepts_difficulty=body.adaptation_accepts_difficulty,
            adaptation_persistence=body.adaptation_persistence,
            adaptation_strategy_variety=body.adaptation_strategy_variety,
            relationship_score=body.relationship_score,
            relationship_collaboration=body.relationship_collaboration,
            relationship_conflict_handling=body.relationship_conflict_handling,
            relationship_help_exchange=body.relationship_help_exchange,
            note=body.note.strip() if body.note is not None and body.note.strip() else None,
        )
        data = submit_interview(db, payload)
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={"code": 400, "message": "invalid request"},
        )
    except Exception:
        db.rollback()
        return JSONResponse(
            status_code=400,
            content={"code": 400, "message": "invalid request"},
        )

    return {"code": 200, "message": "success", "data": data}
