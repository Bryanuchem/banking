from __future__ import annotations

import logging
import signal
import time

from app.database.session import SessionLocal
from app.jobs.definitions import JOB_DEFINITIONS
from app.jobs.service import JobService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("banking.worker")

_running = True


def _stop(*_args) -> None:
    global _running
    _running = False


def run_forever() -> None:
    signal.signal(signal.SIGINT, _stop)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, _stop)

    logger.info("Background worker started.")

    while _running:
        with SessionLocal() as db:
            try:
                if not JobService.worker_enabled(db):
                    db.rollback()
                else:
                    for definition in JOB_DEFINITIONS:
                        if not JobService.is_due(
                            db,
                            definition,
                        ):
                            continue

                        run = JobService.run(
                            db,
                            job_name=definition.name,
                            trigger="schedule",
                        )
                        db.commit()
                        logger.info(
                            "%s -> %s (processed=%s failed=%s)",
                            definition.name,
                            run.status,
                            run.items_processed,
                            run.items_failed,
                        )
            except Exception:
                db.rollback()
                logger.exception(
                    "Worker scheduler iteration failed."
                )

        time.sleep(5)

    logger.info("Background worker stopped.")


if __name__ == "__main__":
    run_forever()
