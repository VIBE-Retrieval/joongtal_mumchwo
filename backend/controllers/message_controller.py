from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import message_service

router = APIRouter(prefix="/messages", tags=["messages"])


class SendEncouragementRequest(BaseModel):
    student_id: str
    message: str
    mentor_id: str | None = None


@router.post("/encouragement")
def send_encouragement(body: SendEncouragementRequest, db: Session = Depends(get_db)):
    data = message_service.send_encouragement(
        db,
        student_id=body.student_id,
        message=body.message,
        mentor_id=body.mentor_id,
    )
    return {"code": 200, "message": "success", "data": data}
