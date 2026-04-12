from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

_BACKEND_DIR = Path(__file__).resolve().parent
_DEFAULT_SQLITE = _BACKEND_DIR / "app.db"

DATABASE_URL = f"sqlite:///{_DEFAULT_SQLITE}"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
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
