from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.survey_service import DailySurveyInput, submit_daily_survey

router = APIRouter(prefix="/surveys", tags=["surveys"])


class DailySurveyBody(BaseModel):
    student_id: str = Field(min_length=1)
    survey_date: str
    achievement_score: int
    adaptation_score: int
    relationship_score: int

    @field_validator("student_id")
    @classmethod
    def student_id_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("student_id required")
        return s

    @field_validator("achievement_score", "adaptation_score", "relationship_score")
    @classmethod
    def score_range(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("score must be 1..5")
        return v

    @field_validator("survey_date")
    @classmethod
    def survey_date_fmt(cls, v: str) -> str:
        datetime.strptime(v, "%Y-%m-%d")
        return v


@router.post("/daily")
def post_daily_survey(body: DailySurveyBody, db: Session = Depends(get_db)):
    try:
        parsed = DailySurveyInput(
            student_id=body.student_id,
            survey_date=date.fromisoformat(body.survey_date),
            achievement_score=body.achievement_score,
            adaptation_score=body.adaptation_score,
            relationship_score=body.relationship_score,
        )
        data = submit_daily_survey(db, parsed)
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
