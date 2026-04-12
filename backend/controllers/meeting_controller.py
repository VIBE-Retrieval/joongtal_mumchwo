from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import meeting_service

router = APIRouter(prefix="/meetings", tags=["meetings"])


class TimeSlotModel(BaseModel):
    date: str
    time: str


class CreateMeetingRequest(BaseModel):
    student_id: str
    mentor_id: str
    mentor_name: str
    student_name: str
    purpose: str
    message: str = ""
    proposed_slots: list[TimeSlotModel]


class SubmitSlotsRequest(BaseModel):
    selected_slots: list[TimeSlotModel]


class ConfirmSlotRequest(BaseModel):
    confirmed_slot: TimeSlotModel


@router.post("")
def create_meeting(body: CreateMeetingRequest, db: Session = Depends(get_db)):
    slots = [s.model_dump() for s in body.proposed_slots]
    data = meeting_service.create_meeting(
        db,
        student_id=body.student_id,
        mentor_id=body.mentor_id,
        mentor_name=body.mentor_name,
        student_name=body.student_name,
        purpose=body.purpose,
        message=body.message,
        proposed_slots=slots,
    )
    return {"code": 200, "message": "success", "data": data}


@router.get("/student/{student_id}")
def list_meetings_for_student(student_id: str, db: Session = Depends(get_db)):
    data = meeting_service.get_meetings_for_student(db, student_id)
    return {"code": 200, "message": "success", "data": data}


@router.get("/mentor/{mentor_id}")
def list_meetings_for_mentor(mentor_id: str, db: Session = Depends(get_db)):
    data = meeting_service.get_meetings_for_mentor(db, mentor_id)
    return {"code": 200, "message": "success", "data": data}


@router.put("/{meeting_id}/slots")
def submit_slots(meeting_id: int, body: SubmitSlotsRequest, db: Session = Depends(get_db)):
    try:
        slots = [s.model_dump() for s in body.selected_slots]
        data = meeting_service.submit_slots(db, meeting_id, slots)
    except ValueError:
        return JSONResponse(
            status_code=404,
            content={"code": 404, "message": "meeting not found"},
        )
    return {"code": 200, "message": "success", "data": data}


@router.put("/{meeting_id}/confirm")
def confirm_slot(meeting_id: int, body: ConfirmSlotRequest, db: Session = Depends(get_db)):
    try:
        data = meeting_service.confirm_slot(
            db,
            meeting_id,
            body.confirmed_slot.model_dump(),
        )
    except ValueError:
        return JSONResponse(
            status_code=404,
            content={"code": 404, "message": "meeting not found"},
        )
    return {"code": 200, "message": "success", "data": data}
