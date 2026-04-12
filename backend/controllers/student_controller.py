from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import student_service

router = APIRouter(prefix="/students", tags=["students"])


def _ok(data):
    return {"code": 200, "message": "success", "data": data}


def _nf():
    return JSONResponse(
        status_code=404,
        content={"code": 404, "message": "not found"},
    )


@router.get("/{student_id}/process-risk")
def get_process_risk(student_id: str, db: Session = Depends(get_db)):
    data = student_service.get_process_risk(db, student_id)
    if data is None:
        return _nf()
    return _ok(data)


@router.get("/{student_id}/interview-risk")
def get_interview_risk(student_id: str, db: Session = Depends(get_db)):
    data = student_service.get_interview_risk(db, student_id)
    if data is None:
        return _nf()
    return _ok(data)


@router.get("/{student_id}/latest-analysis")
def get_latest_analysis(student_id: str, db: Session = Depends(get_db)):
    data = student_service.get_latest_analysis(db, student_id)
    return _ok(data)


@router.get("/{student_id}/progress")
def get_progress(student_id: str, db: Session = Depends(get_db)):
    data = student_service.get_progress(db, student_id)
    return _ok(data)
