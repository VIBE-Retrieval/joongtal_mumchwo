from __future__ import annotations

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.controllers.interview_controller import router as interview_router
from backend.controllers.survey_controller import router as survey_router
from backend.database import init_db

app = FastAPI(title="joongtal mumchwo API")

app.include_router(survey_router)
app.include_router(interview_router)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(_: Request, __: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"code": 400, "message": "invalid request"},
    )


@app.on_event("startup")
def on_startup():
    init_db()
