from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _build_database_url() -> str:
    host     = os.environ.get("DB_HOST", "")
    port     = os.environ.get("DB_PORT", "3306")
    name     = os.environ.get("DB_NAME", "")
    user     = os.environ.get("DB_USER", "")
    password = os.environ.get("DB_PASSWORD", "")

    if not all([host, name, user, password]):
        raise RuntimeError(
            "DB 환경변수가 설정되지 않았습니다. "
            ".env 파일에 DB_HOST, DB_NAME, DB_USER, DB_PASSWORD를 입력하세요."
        )
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"


class Base(DeclarativeBase):
    pass


import ssl as _ssl
_ssl_ctx = _ssl.SSLContext(_ssl.PROTOCOL_TLS_CLIENT)
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = _ssl.CERT_NONE

engine = create_engine(
    _build_database_url(),
    connect_args={"ssl": _ssl_ctx},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from backend import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
