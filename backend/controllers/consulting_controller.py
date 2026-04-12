from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import consulting_service

router = APIRouter(prefix="/consultings", tags=["consultings"])


class CompleteCareRequest(BaseModel):
    student_id: str
    mentor_feedback: str | None = None
    action_effective: int | None = None


@router.post("")
def complete_care(body: CompleteCareRequest, db: Session = Depends(get_db)):
    data = consulting_service.complete_care(
        db,
        student_id=body.student_id,
        mentor_feedback=body.mentor_feedback,
        action_effective=body.action_effective,
    )
    return {"code": 200, "message": "success", "data": data}
