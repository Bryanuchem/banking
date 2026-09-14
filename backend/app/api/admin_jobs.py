from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.database.dependencies import get_db
from app.jobs.definitions import JOBS_BY_NAME
from app.jobs.service import JobService
from app.models.job_run import JobRun
from app.models.user import User
from app.schemas.jobs import (
    AdminJobItem,
    AdminJobRunItem,
    AdminJobRunListResponse,
    AdminJobsResponse,
)

router = APIRouter(
    prefix="/admin/jobs",
    tags=["admin-jobs"],
)


def _run_view(item: JobRun) -> AdminJobRunItem:
    return AdminJobRunItem(
        id=item.id,
        job_name=item.job_name,
        trigger=item.trigger,
        status=item.status,
        items_processed=item.items_processed,
        items_failed=item.items_failed,
        error_message=item.error_message,
        details=item.details,
        actor_user_id=item.actor_user_id,
        started_at=item.started_at,
        finished_at=item.finished_at,
    )


@router.get("", response_model=AdminJobsResponse)
def list_jobs(
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items = []
    for row in JobService.dashboard(db):
        latest = row["last_run"]
        items.append(
            AdminJobItem(
                name=row["name"],
                label=row["label"],
                description=row["description"],
                interval_seconds=row["interval_seconds"],
                next_run_at=row["next_run_at"],
                last_run=(
                    _run_view(latest)
                    if latest is not None
                    else None
                ),
            )
        )

    return AdminJobsResponse(
        worker_enabled=JobService.worker_enabled(db),
        items=items,
    )


@router.get("/runs", response_model=AdminJobRunListResponse)
def list_job_runs(
    job_name: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stmt = select(JobRun)
    count_stmt = select(func.count()).select_from(JobRun)

    if job_name:
        stmt = stmt.where(JobRun.job_name == job_name)
        count_stmt = count_stmt.where(
            JobRun.job_name == job_name
        )

    total = int(db.scalar(count_stmt) or 0)
    rows = db.scalars(
        stmt.order_by(JobRun.started_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    status_counts = dict(
        db.execute(
            select(
                JobRun.status,
                func.count(),
            )
            .group_by(JobRun.status)
        ).all()
    )

    return AdminJobRunListResponse(
        items=[_run_view(item) for item in rows],
        total=total,
        completed=int(
            status_counts.get(
                "completed",
                0,
            )
        ),
        warning=int(
            status_counts.get(
                "warning",
                0,
            )
        ),
        failed=int(
            status_counts.get(
                "failed",
                0,
            )
        ),
        running=int(
            status_counts.get(
                "running",
                0,
            )
        ),
    )


@router.post(
    "/{job_name}/run",
    response_model=AdminJobRunItem,
)
def run_job_now(
    job_name: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if job_name not in JOBS_BY_NAME:
        raise HTTPException(
            status_code=404,
            detail="Unknown background job.",
        )

    run = JobService.run(
        db,
        job_name=job_name,
        trigger="manual",
        actor_user_id=admin.id,
    )
    db.commit()
    db.refresh(run)
    return _run_view(run)
