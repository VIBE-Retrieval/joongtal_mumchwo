from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
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


class RegisterStudentBody(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=1)
    birth_date: str = Field(min_length=8, max_length=8)

    @field_validator("birth_date")
    @classmethod
    def birth_date_digits(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("birth_date must be 8 digits YYYYMMDD")
        return v


@router.post("")
def register_student(body: RegisterStudentBody, db: Session = Depends(get_db)):
    try:
        data = student_service.register_student(
            db,
            name=body.name,
            email=body.email,
            birth_date=body.birth_date,
        )
    except ValueError as e:
        return JSONResponse(
            status_code=409,
            content={"code": 409, "message": str(e)},
        )
    return JSONResponse(
        status_code=201,
        content={"code": 201, "message": "학생 등록 성공", "data": data},
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


@router.get("/{student_id}/care-message")
def get_care_message(student_id: str, db: Session = Depends(get_db)):
    data = student_service.get_care_message(db, student_id)
    return _ok(data)
