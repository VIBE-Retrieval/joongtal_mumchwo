from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import mentor_service

router = APIRouter(prefix="/mentor", tags=["mentor"])


@router.get("/students/risks")
def get_students_risks(db: Session = Depends(get_db)):
    data = mentor_service.list_student_risks(db)
    for item in data.get("items", []):
        item.setdefault("risk_history", [])
    return {"code": 200, "message": "success", "data": data}


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    data = mentor_service.list_alerts(db)
    return {"code": 200, "message": "success", "data": data}


@router.patch("/alerts/{intervention_id}/read")
def read_alert(intervention_id: int, db: Session = Depends(get_db)):
    success = mentor_service.read_alert(db, intervention_id)
    return {"code": 200, "message": "success", "data": {"success": success}}


@router.post("/alerts/read-all")
def read_all_alerts(db: Session = Depends(get_db)):
    updated = mentor_service.read_all_alerts(db)
    return {"code": 200, "message": "success", "data": {"updated": updated}}
