from datetime import date
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.enums import ReportStatus
from app.models.project import Project
from app.models.user import User
from app.models.weekly_report import WeeklyReport
from app.schemas.report import (
    WeeklyReportCreate,
    WeeklyReportHistoryPage,
    WeeklyReportRead,
    WeeklyReportUpdate,
)

router = APIRouter()


def _get_own_report_or_404(report_id: int, current_user: User, db: Session) -> WeeklyReport:
    report = (
        db.query(WeeklyReport)
        .options(joinedload(WeeklyReport.project))
        .filter(WeeklyReport.id == report_id)
        .first()
    )
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    if report.user_id != current_user.id:
        # 404 instead of 403 so users can't probe which report IDs exist
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report


def _validate_project_exists(project_id: int, db: Session) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The specified project does not exist",
        )
    if not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The specified project is no longer active",
        )


@router.post("/", response_model=WeeklyReportRead, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: WeeklyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_project_exists(payload.project_id, db)

    report = WeeklyReport(
        user_id=current_user.id,
        project_id=payload.project_id,
        week_start_date=payload.week_start_date,
        week_end_date=payload.week_end_date,
        tasks_completed=payload.tasks_completed,
        tasks_planned=payload.tasks_planned,
        blockers=payload.blockers,
        hours_worked=payload.hours_worked,
        notes=payload.notes,
        status=ReportStatus.DRAFT,
    )
    db.add(report)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A report already exists for this project and week",
        )
    db.refresh(report)
    return report


@router.get("/", response_model=list[WeeklyReportRead])
def list_my_reports(
    week_start_date: Optional[date] = Query(
        None, description="Filter reports by exact week_start_date"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(WeeklyReport)
        .options(joinedload(WeeklyReport.project))
        .filter(WeeklyReport.user_id == current_user.id)
    )
    if week_start_date is not None:
        query = query.filter(WeeklyReport.week_start_date == week_start_date)

    return query.order_by(WeeklyReport.week_start_date.desc()).all()


@router.get("/history", response_model=WeeklyReportHistoryPage)
def get_my_report_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = db.query(WeeklyReport).filter(WeeklyReport.user_id == current_user.id)

    total = base_query.count()
    total_pages = ceil(total / page_size) if total else 0

    items = (
        base_query.options(joinedload(WeeklyReport.project))
        .order_by(WeeklyReport.week_start_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return WeeklyReportHistoryPage(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{report_id}", response_model=WeeklyReportRead)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_own_report_or_404(report_id, current_user, db)


@router.put("/{report_id}", response_model=WeeklyReportRead)
def update_report(
    report_id: int,
    payload: WeeklyReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = _get_own_report_or_404(report_id, current_user, db)

    if report.status == ReportStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submitted reports cannot be edited",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "project_id" in update_data:
        _validate_project_exists(update_data["project_id"], db)

    for field, value in update_data.items():
        setattr(report, field, value)

    # Re-validate week range if either date changed
    if report.week_end_date < report.week_start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="week_end_date cannot be before week_start_date",
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A report already exists for this project and week",
        )
    db.refresh(report)
    return report


@router.post("/{report_id}/submit", response_model=WeeklyReportRead)
def submit_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = _get_own_report_or_404(report_id, current_user, db)

    if report.status == ReportStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This report has already been submitted",
        )

    from datetime import datetime, timezone

    report.status = ReportStatus.SUBMITTED
    report.submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(report)
    return report