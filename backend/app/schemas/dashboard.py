from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReportStatus


class DashboardSummary(BaseModel):
    week_start_date: date
    total_team_members: int
    total_reports_submitted: int
    total_pending: int
    total_late: int
    compliance_rate: float  # submitted / total_team_members, 0.0–1.0
    open_blockers_count: int


class MemberSubmissionStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: str
    status: ReportStatus
    submitted_at: Optional[datetime] = None
    report_id: Optional[int] = None


class DashboardReportItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_full_name: str
    project_id: int
    project_name: str
    week_start_date: date
    week_end_date: date
    status: ReportStatus
    tasks_completed: str
    tasks_planned: str
    blockers: Optional[str] = None
    hours_worked: Optional[float] = None
    submitted_at: Optional[datetime] = None


class TaskTrendPoint(BaseModel):
    week_start_date: date
    reports_submitted: int


class ProjectWorkload(BaseModel):
    project_id: int
    project_name: str
    report_count: int


class ActivityItem(BaseModel):
    report_id: int
    user_full_name: str
    project_name: str
    status: ReportStatus
    week_start_date: date
    updated_at: datetime