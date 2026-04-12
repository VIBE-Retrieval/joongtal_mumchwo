from __future__ import annotations

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.controllers.auth_controller import router as auth_router
from backend.controllers.consulting_controller import router as consulting_router
from backend.controllers.interview_controller import router as interview_router
from backend.controllers.message_controller import router as message_router
from backend.controllers.meeting_controller import router as meeting_router
from backend.controllers.mentor_controller import router as mentor_router
from backend.controllers.student_controller import router as student_router
from backend.controllers.survey_controller import router as survey_router
from backend.database import init_db

app = FastAPI(title="joongtal mumchwo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(survey_router)
app.include_router(interview_router)
app.include_router(student_router)
app.include_router(mentor_router)
app.include_router(consulting_router)
app.include_router(message_router)
app.include_router(meeting_router)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(_: Request, __: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"code": 400, "message": "invalid request"},
    )


@app.on_event("startup")
def on_startup():
    init_db()
