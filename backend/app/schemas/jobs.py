from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AdminJobRunItem(BaseModel):
    id: UUID
    job_name: str
    trigger: str
    status: str
    items_processed: int
    items_failed: int
    error_message: str | None
    details: dict[str, Any] | None
    actor_user_id: UUID | None
    started_at: datetime
    finished_at: datetime | None


class AdminJobItem(BaseModel):
    name: str
    label: str
    description: str
    interval_seconds: int
    next_run_at: datetime | None
    last_run: AdminJobRunItem | None


class AdminJobsResponse(BaseModel):
    worker_enabled: bool
    items: list[AdminJobItem]


class AdminJobRunListResponse(BaseModel):
    items: list[AdminJobRunItem]
    total: int
