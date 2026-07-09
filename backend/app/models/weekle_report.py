from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ReportStatus

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class WeeklyReport(Base, TimestampMixin):
    __tablename__ = "weekly_reports"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "project_id", "week_start_date",
            name="uq_report_per_user_project_week",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )

    week_start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    week_end_date: Mapped[date] = mapped_column(Date, nullable=False)

    tasks_completed: Mapped[str] = mapped_column(Text, nullable=False)
    tasks_planned: Mapped[str] = mapped_column(Text, nullable=False)
    blockers: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hours_worked: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status", native_enum=False),
        default=ReportStatus.DRAFT,
        nullable=False,
        index=True,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    author: Mapped["User"] = relationship(back_populates="reports", foreign_keys=[user_id])
    project: Mapped["Project"] = relationship(back_populates="reports")

    def __repr__(self) -> str:
        return (
            f"<WeeklyReport id={self.id} user_id={self.user_id} "
            f"week={self.week_start_date} status={self.status}>"
        )