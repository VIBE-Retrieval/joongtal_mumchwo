from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

_ALLOWED_ROLES = frozenset({"student", "mentor", "interviewer"})


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    birth_date: str = Field(..., min_length=1)
    role: str


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    if body.role not in _ALLOWED_ROLES:
        return JSONResponse(
            status_code=400,
            content={"code": 400, "message": "invalid request"},
        )

    result = auth_service.login(db, body.email, body.birth_date, body.role)
    if result is None:
        return JSONResponse(
            status_code=401,
            content={"code": 401, "message": "이메일 또는 생년월일이 올바르지 않습니다."},
        )

    return {
        "code": 200,
        "message": "로그인 성공",
        "data": result,
    }
