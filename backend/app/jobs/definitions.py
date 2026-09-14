from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Callable

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.enums.payment_status import PaymentStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.idempotency_record import IdempotencyRecord
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.user_session import UserSession
from app.models.withdrawal import Withdrawal
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
from app.services.reconciliation_service import ReconciliationService
from app.services.setting_service import SettingService


@dataclass(frozen=True)
class JobDefinition:
    name: str
    label: str
    description: str
    interval_key: str
    default_interval_seconds: int
    handler: Callable[[Session], dict]


def _payment_verification(db: Session) -> dict:
    cutoff = datetime.now(UTC) - timedelta(minutes=1)
    payment_ids = db.scalars(
        select(Payment.id)
        .where(
            Payment.status.in_(
                [
                    PaymentStatus.PENDING.value,
                    PaymentStatus.INITIALIZED.value,
                ]
            ),
            Payment.created_at <= cutoff,
        )
        .order_by(Payment.created_at.asc())
        .limit(50)
    ).all()

    processed = 0
    failed = 0

    for payment_id in payment_ids:
        try:
            with db.begin_nested():
                payment = db.get(Payment, payment_id)
                if payment is None:
                    continue
                PaymentService.verify_payment(
                    db,
                    payment.provider_reference
                    or payment.internal_reference,
                )
                processed += 1
        except Exception:
            failed += 1

    return {
        "items_processed": processed,
        "items_failed": failed,
        "details": {
            "candidates": len(payment_ids),
        },
    }


def _reconciliation(db: Session) -> dict:
    result = ReconciliationService.all_accounts(db)
    mismatched = int(result["mismatched"])

    if mismatched:
        recent = db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.event_type
                == "operations.reconciliation_mismatch",
                Notification.created_at
                >= datetime.now(UTC)
                - timedelta(minutes=30),
            )
        ) or 0

        if not recent:
            NotificationService.safe_notify_admins(
                db,
                title="Reconciliation needs attention",
                message=(
                    f"{mismatched} account(s) do not currently match "
                    "their expected ledger or held balances."
                ),
                event_type="operations.reconciliation_mismatch",
                category="system",
                severity="warning",
                action_url="/admin/reconciliation",
                metadata={
                    "checked": int(result["checked"]),
                    "mismatched": mismatched,
                },
            )

    return {
        "items_processed": int(result["checked"]),
        "items_failed": mismatched,
        "details": {
            "checked": int(result["checked"]),
            "mismatched": mismatched,
        },
    }


def _withdrawal_monitor(db: Session) -> dict:
    cutoff = datetime.now(UTC) - timedelta(minutes=15)
    awaiting_review = int(
        db.scalar(
            select(func.count())
            .select_from(Withdrawal)
            .where(
                Withdrawal.status.in_(
                    [
                        WithdrawalStatus.PENDING_REVIEW.value,
                        WithdrawalStatus.FEE_PAID.value,
                        WithdrawalStatus.PENDING.value,
                    ]
                ),
                Withdrawal.updated_at <= cutoff,
            )
        )
        or 0
    )

    return {
        "items_processed": awaiting_review,
        "items_failed": 0,
        "details": {
            "awaiting_review_over_15_minutes": awaiting_review,
        },
    }


def _session_cleanup(db: Session) -> dict:
    retention_days = max(
        1,
        SettingService.get_integer(
            db,
            SettingKeys.WORKER_SESSION_RETENTION_DAYS,
            30,
        ),
    )
    cutoff = datetime.now(UTC) - timedelta(days=retention_days)

    result = db.execute(
        delete(UserSession).where(
            (
                (UserSession.expires_at < cutoff)
                | (
                    UserSession.revoked_at.is_not(None)
                    & (UserSession.revoked_at < cutoff)
                )
            )
        )
    )
    count = int(result.rowcount or 0)

    return {
        "items_processed": count,
        "items_failed": 0,
        "details": {
            "retention_days": retention_days,
        },
    }


def _notification_cleanup(db: Session) -> dict:
    result = db.execute(
        delete(Notification).where(
            Notification.expires_at.is_not(None),
            Notification.expires_at <= datetime.now(UTC),
        )
    )
    count = int(result.rowcount or 0)

    return {
        "items_processed": count,
        "items_failed": 0,
        "details": {},
    }


def _idempotency_cleanup(db: Session) -> dict:
    retention_hours = max(
        24,
        SettingService.get_integer(
            db,
            SettingKeys.WORKER_IDEMPOTENCY_RETENTION_HOURS,
            168,
        ),
    )
    cutoff = datetime.now(UTC) - timedelta(hours=retention_hours)

    result = db.execute(
        delete(IdempotencyRecord).where(
            IdempotencyRecord.created_at < cutoff
        )
    )
    count = int(result.rowcount or 0)

    return {
        "items_processed": count,
        "items_failed": 0,
        "details": {
            "retention_hours": retention_hours,
        },
    }


JOB_DEFINITIONS: tuple[JobDefinition, ...] = (
    JobDefinition(
        name="payment_verification",
        label="Payment verification",
        description="Re-check pending payment attempts when a webhook has not completed them.",
        interval_key=SettingKeys.WORKER_PAYMENT_VERIFICATION_INTERVAL_SECONDS,
        default_interval_seconds=60,
        handler=_payment_verification,
    ),
    JobDefinition(
        name="reconciliation",
        label="Reconciliation",
        description="Compare account balances, ledger balances, and active withdrawal holds.",
        interval_key=SettingKeys.WORKER_RECONCILIATION_INTERVAL_SECONDS,
        default_interval_seconds=300,
        handler=_reconciliation,
    ),
    JobDefinition(
        name="withdrawal_monitor",
        label="Withdrawal review monitor",
        description="Surface withdrawals that have remained awaiting review for more than 15 minutes.",
        interval_key=SettingKeys.WORKER_WITHDRAWAL_MONITOR_INTERVAL_SECONDS,
        default_interval_seconds=120,
        handler=_withdrawal_monitor,
    ),
    JobDefinition(
        name="session_cleanup",
        label="Session cleanup",
        description="Prune expired or revoked sessions after the configured retention window.",
        interval_key=SettingKeys.WORKER_SESSION_CLEANUP_INTERVAL_SECONDS,
        default_interval_seconds=600,
        handler=_session_cleanup,
    ),
    JobDefinition(
        name="notification_cleanup",
        label="Notification cleanup",
        description="Remove notifications whose explicit expiry time has passed.",
        interval_key=SettingKeys.WORKER_NOTIFICATION_CLEANUP_INTERVAL_SECONDS,
        default_interval_seconds=1800,
        handler=_notification_cleanup,
    ),
    JobDefinition(
        name="idempotency_cleanup",
        label="Idempotency cleanup",
        description="Prune old idempotency keys after the configured retention window.",
        interval_key=SettingKeys.WORKER_IDEMPOTENCY_CLEANUP_INTERVAL_SECONDS,
        default_interval_seconds=3600,
        handler=_idempotency_cleanup,
    ),
)

JOBS_BY_NAME = {
    definition.name: definition
    for definition in JOB_DEFINITIONS
}
