from app.constants.setting_key import SettingKeys
from app.jobs.definitions import JOBS_BY_NAME
from app.models.job_run import JobRun


def test_background_job_registry_contains_operational_jobs() -> None:
    assert set(JOBS_BY_NAME) == {
        "payment_verification",
        "reconciliation",
        "withdrawal_monitor",
        "session_cleanup",
        "notification_cleanup",
        "idempotency_cleanup",
    }


def test_job_runs_table_contract() -> None:
    assert JobRun.__tablename__ == "job_runs"


def test_worker_intervals_are_db_backed_settings() -> None:
    assert (
        SettingKeys.WORKER_RECONCILIATION_INTERVAL_SECONDS
        == "worker_reconciliation_interval_seconds"
    )
    assert (
        SettingKeys.WORKER_PAYMENT_VERIFICATION_INTERVAL_SECONDS
        == "worker_payment_verification_interval_seconds"
    )
