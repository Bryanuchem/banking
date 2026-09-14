from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import desc, select, text
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.jobs.definitions import JOB_DEFINITIONS, JOBS_BY_NAME, JobDefinition
from app.models.job_run import JobRun
from app.services.setting_service import SettingService


class JobService:
    @staticmethod
    def worker_enabled(db: Session) -> bool:
        return SettingService.get_boolean(
            db,
            SettingKeys.WORKER_ENABLED,
            True,
        )

    @staticmethod
    def interval_seconds(
        db: Session,
        definition: JobDefinition,
    ) -> int:
        return max(
            30,
            SettingService.get_integer(
                db,
                definition.interval_key,
                definition.default_interval_seconds,
            ),
        )

    @classmethod
    def latest_run(
        cls,
        db: Session,
        job_name: str,
    ) -> JobRun | None:
        return db.scalar(
            select(JobRun)
            .where(JobRun.job_name == job_name)
            .order_by(desc(JobRun.started_at))
            .limit(1)
        )

    @classmethod
    def is_due(
        cls,
        db: Session,
        definition: JobDefinition,
        *,
        now: datetime | None = None,
    ) -> bool:
        now = now or datetime.now(UTC)
        latest = cls.latest_run(db, definition.name)
        if latest is None:
            return True

        reference = latest.finished_at or latest.started_at
        return reference + timedelta(
            seconds=cls.interval_seconds(db, definition)
        ) <= now

    @classmethod
    def run(
        cls,
        db: Session,
        *,
        job_name: str,
        trigger: str,
        actor_user_id: UUID | None = None,
    ) -> JobRun:
        definition = JOBS_BY_NAME.get(job_name)
        if definition is None:
            raise KeyError(job_name)

        run = JobRun(
            job_name=definition.name,
            trigger=trigger,
            status="running",
            actor_user_id=actor_user_id,
        )
        db.add(run)
        db.flush()

        # PostgreSQL transaction-scoped advisory lock prevents two worker
        # processes or a manual admin run from processing the same job at once.
        acquired = bool(
            db.scalar(
                text(
                    "SELECT pg_try_advisory_xact_lock("
                    "hashtext(:job_name))"
                ),
                {"job_name": definition.name},
            )
        )
        if not acquired:
            run.status = "skipped"
            run.error_message = "Another runner already owns this job."
            run.finished_at = datetime.now(UTC)
            db.flush()
            return run

        try:
            with db.begin_nested():
                result = definition.handler(db)

            run.items_processed = int(
                result.get("items_processed", 0)
            )
            run.items_failed = int(
                result.get("items_failed", 0)
            )
            run.details = result.get("details") or {}
            run.status = (
                "warning"
                if run.items_failed > 0
                else "completed"
            )
        except Exception as exc:
            run.status = "failed"
            run.error_message = str(exc)[:2000]
        finally:
            run.finished_at = datetime.now(UTC)
            db.flush()

        return run

    @classmethod
    def dashboard(cls, db: Session) -> list[dict]:
        items: list[dict] = []

        for definition in JOB_DEFINITIONS:
            interval = cls.interval_seconds(
                db,
                definition,
            )
            latest = cls.latest_run(
                db,
                definition.name,
            )
            next_run_at = None
            if latest is not None:
                reference = (
                    latest.finished_at
                    or latest.started_at
                )
                next_run_at = reference + timedelta(
                    seconds=interval
                )

            items.append(
                {
                    "name": definition.name,
                    "label": definition.label,
                    "description": definition.description,
                    "interval_seconds": interval,
                    "next_run_at": next_run_at,
                    "last_run": latest,
                }
            )

        return items
