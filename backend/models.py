from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class DailySurvey(Base):
    __tablename__ = "daily_survey"
    __table_args__ = (UniqueConstraint("student_id", "survey_date", name="uq_daily_survey_student_date"),)

    survey_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    survey_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    achievement_score: Mapped[int] = mapped_column(Integer, nullable=False)
    adaptation_score: Mapped[int] = mapped_column(Integer, nullable=False)
    relationship_score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ProcessRiskHistory(Base):
    __tablename__ = "process_risk_history"
    __table_args__ = (UniqueConstraint("student_id", "date", name="uq_process_risk_student_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)
    risk_trend: Mapped[str] = mapped_column(String(16), nullable=False)
    consecutive_risk_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feature_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
