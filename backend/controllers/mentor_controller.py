from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import mentor_service

router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.get("/students/risks")
def get_students_risks(db: Session = Depends(get_db)):
    data = mentor_service.list_student_risks(db)
    return {"code": 200, "message": "success", "data": data}


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    data = mentor_service.list_alerts(db)
    return {"code": 200, "message": "success", "data": data}
