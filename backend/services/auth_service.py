from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session

from backend.repositories import auth_repository

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def _create_access_token(*, user_id: str, role: str, name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "role": role,
        "name": name,
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def login(db: Session, email: str, birth_date: str, role: str) -> dict | None:
    user = auth_repository.find_by_email_and_birth_date(db, email, birth_date, role)
    if user is None:
        return None
    token = _create_access_token(
        user_id=user["id"],
        role=user["role"],
        name=user["name"],
    )
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
        },
    }
