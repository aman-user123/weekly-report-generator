from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_manager_or_admin
from app.core.database import get_db
from app.models.enums import ReportStatus, UserRole
from app.models.project import Project
from app.models.user import User
from app.models.weekly_report import WeeklyReport
from app.schemas.dashboard import (
    ActivityItem,
    DashboardReportItem,
    DashboardSummary,
    MemberSubmissionStatus,
    ProjectWorkload,
    TaskTrendPoint,
)

router = APIRouter()


def _current_week_start(today: Optional[date] = None) -> date:
    """Returns the Monday of the current week."""
    today = today or date.today()
    return today - timedelta(days=today.weekday())


def _get_team_members(db: Session) -> List[User]:
    return (
        db.query(User)
        .filter(User.role == UserRole.TEAM_MEMBER, User.is_active.is_(True))
        .all()
    )


def _reports_for_week(db: Session, week_start_date: date):
    return (
        db.query(WeeklyReport)
        .options(joinedload(WeeklyReport.project), joinedload(WeeklyReport.author))
        .filter(WeeklyReport.week_start_date == week_start_date)
    )


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    week_start_date: Optional[date] = Query(
        None, description="Defaults to the current week (Monday-based) if omitted"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    week_start_date = week_start_date or _current_week_start()
    today = date.today()

    team_members = _get_team_members(db)
    reports = _reports_for_week(db, week_start_date).all()
    reports_by_user = {r.user_id: r for r in reports}

    submitted = 0
    pending = 0
    late = 0
    open_blockers = 0

    for member in team_members:
        report = reports_by_user.get(member.id)
        if report and report.status == ReportStatus.SUBMITTED:
            submitted += 1
        elif week_start_date + timedelta(days=6) < today:
            # Week is fully over and nothing was submitted
            late += 1
        else:
            pending += 1

    for report in reports:
        if report.blockers and report.blockers.strip():
            open_blockers += 1

    total = len(team_members)
    compliance_rate = round(submitted / total, 4) if total else 0.0

    return DashboardSummary(
        week_start_date=week_start_date,
        total_team_members=total,
        total_reports_submitted=submitted,
        total_pending=pending,
        total_late=late,
        compliance_rate=compliance_rate,
        open_blockers_count=open_blockers,
    )


@router.get("/submission-status", response_model=List[MemberSubmissionStatus])
def get_submission_status(
    week_start_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """Per-team-member submitted / pending / late status for a given week."""
    week_start_date = week_start_date or _current_week_start()
    today = date.today()

    team_members = _get_team_members(db)
    reports = _reports_for_week(db, week_start_date).all()
    reports_by_user = {r.user_id: r for r in reports}

    results = []
    for member in team_members:
        report = reports_by_user.get(member.id)

        if report and report.status == ReportStatus.SUBMITTED:
            status_value = ReportStatus.SUBMITTED
            submitted_at = report.submitted_at
        elif week_start_date + timedelta(days=6) < today:
            status_value = ReportStatus.LATE
            submitted_at = None
        else:
            status_value = ReportStatus.DRAFT  # treated as "pending" in the UI
            submitted_at = None

        results.append(
            MemberSubmissionStatus(
                user_id=member.id,
                full_name=member.full_name,
                email=member.email,
                status=status_value,
                submitted_at=submitted_at,
                report_id=report.id if report else None,
            )
        )

    return results


@router.get("/reports", response_model=List[DashboardReportItem])
def get_team_reports(
    user_id: Optional[int] = Query(None, description="Filter by team member"),
    project_id: Optional[int] = Query(None, description="Filter by project/category"),
    date_from: Optional[date] = Query(None, description="Filter week_start_date >= this date"),
    date_to: Optional[date] = Query(None, description="Filter week_start_date <= this date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """Cross-team report view with filters, for the manager dashboard."""
    query = db.query(WeeklyReport).options(
        joinedload(WeeklyReport.project), joinedload(WeeklyReport.author)
    )

    if user_id is not None:
        query = query.filter(WeeklyReport.user_id == user_id)
    if project_id is not None:
        query = query.filter(WeeklyReport.project_id == project_id)
    if date_from is not None:
        query = query.filter(WeeklyReport.week_start_date >= date_from)
    if date_to is not None:
        query = query.filter(WeeklyReport.week_start_date <= date_to)

    reports = query.order_by(WeeklyReport.week_start_date.desc()).all()

    return [
        DashboardReportItem(
            id=r.id,
            user_id=r.user_id,
            user_full_name=r.author.full_name,
            project_id=r.project_id,
            project_name=r.project.name,
            week_start_date=r.week_start_date,
            week_end_date=r.week_end_date,
            status=r.status,
            tasks_completed=r.tasks_completed,
            tasks_planned=r.tasks_planned,
            blockers=r.blockers,
            hours_worked=r.hours_worked,
            submitted_at=r.submitted_at,
        )
        for r in reports
    ]


@router.get("/charts/tasks-trend", response_model=List[TaskTrendPoint])
def get_tasks_trend(
    weeks: int = Query(8, ge=1, le=52, description="Number of past weeks to include"),
    user_id: Optional[int] = Query(None, description="Optional: trend for a single person"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """
    Report-submission volume per week, used as a proxy for "tasks completed trend".
    tasks_completed is stored as free text, so report count is the closest
    quantifiable signal without changing the data model.
    """
    earliest_week = _current_week_start() - timedelta(weeks=weeks - 1)

    query = (
        db.query(
            WeeklyReport.week_start_date,
            func.count(WeeklyReport.id).label("count"),
        )
        .filter(
            WeeklyReport.status == ReportStatus.SUBMITTED,
            WeeklyReport.week_start_date >= earliest_week,
        )
        .group_by(WeeklyReport.week_start_date)
        .order_by(WeeklyReport.week_start_date)
    )

    if user_id is not None:
        query = query.filter(WeeklyReport.user_id == user_id)

    rows = query.all()
    return [TaskTrendPoint(week_start_date=row[0], reports_submitted=row[1]) for row in rows]


@router.get("/charts/workload-by-project", response_model=List[ProjectWorkload])
def get_workload_by_project(
    week_start_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    query = (
        db.query(
            Project.id,
            Project.name,
            func.count(WeeklyReport.id).label("count"),
        )
        .join(WeeklyReport, WeeklyReport.project_id == Project.id)
    )

    if week_start_date is not None:
        query = query.filter(WeeklyReport.week_start_date == week_start_date)

    query = query.group_by(Project.id, Project.name).order_by(func.count(WeeklyReport.id).desc())

    rows = query.all()
    return [
        ProjectWorkload(project_id=row[0], project_name=row[1], report_count=row[2])
        for row in rows
    ]


@router.get("/activity-feed", response_model=List[ActivityItem])
def get_activity_feed(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    reports = (
        db.query(WeeklyReport)
        .options(joinedload(WeeklyReport.project), joinedload(WeeklyReport.author))
        .order_by(WeeklyReport.updated_at.desc())
        .limit(limit)
        .all()
    )

    return [
        ActivityItem(
            report_id=r.id,
            user_full_name=r.author.full_name,
            project_name=r.project.name,
            status=r.status,
            week_start_date=r.week_start_date,
            updated_at=r.updated_at,
        )
        for r in reports
    ]