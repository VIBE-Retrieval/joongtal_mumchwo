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
    name: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(128), nullable=False, default="", unique=True)
    birth_date: Mapped[str] = mapped_column(String(8), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Mentor(Base):
    __tablename__ = "mentors"

    mentor_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    birth_date: Mapped[str] = mapped_column(String(8), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Interviewer(Base):
    __tablename__ = "interviewers"

    interviewer_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    birth_date: Mapped[str] = mapped_column(String(8), nullable=False)
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


class InterviewAssessment(Base):
    __tablename__ = "interview_assessment"

    interview_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    achievement_score: Mapped[int] = mapped_column(Integer, nullable=False)
    achievement_problem_solving: Mapped[int] = mapped_column(Integer, nullable=False)
    achievement_self_learning: Mapped[int] = mapped_column(Integer, nullable=False)
    achievement_process_clarity: Mapped[int] = mapped_column(Integer, nullable=False)
    adaptation_score: Mapped[int] = mapped_column(Integer, nullable=False)
    adaptation_accepts_difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    adaptation_persistence: Mapped[int] = mapped_column(Integer, nullable=False)
    adaptation_strategy_variety: Mapped[int] = mapped_column(Integer, nullable=False)
    relationship_score: Mapped[int] = mapped_column(Integer, nullable=False)
    relationship_collaboration: Mapped[int] = mapped_column(Integer, nullable=False)
    relationship_conflict_handling: Mapped[int] = mapped_column(Integer, nullable=False)
    relationship_help_exchange: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class InterviewRiskHistory(Base):
    __tablename__ = "interview_risk_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    interview_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dropout_risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False, default="interview_ml_v1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class InterventionFeedback(Base):
    __tablename__ = "intervention_feedback"

    feedback_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    intervention_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recovery_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mentor_feedback: Mapped[str | None] = mapped_column(String(32), nullable=True)
    action_effective: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class InterventionHistory(Base):
    __tablename__ = "intervention_history"

    intervention_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    date: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(32), nullable=False)
    priority: Mapped[str] = mapped_column(String(16), nullable=False)
    action_reason: Mapped[str] = mapped_column(String(512), nullable=False)
    llm_summary: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(64), ForeignKey("students.student_id"), index=True)
    mentor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    mentor_name: Mapped[str] = mapped_column(String(64), nullable=False)
    student_name: Mapped[str] = mapped_column(String(64), nullable=False)
    purpose: Mapped[str] = mapped_column(String(128), nullable=False)
    message: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending_availability")
    proposed_slots: Mapped[list] = mapped_column(JSON, nullable=False)
    selected_slots: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    confirmed_slot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    student_notified: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mentor_notified: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
