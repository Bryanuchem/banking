from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.enums.account_status import AccountStatus
from app.enums.ledger_entry_type import LedgerEntryType
from app.enums.payment_status import PaymentStatus
from app.enums.transaction_status import TransactionStatus
from app.enums.transaction_type import TransactionType
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.ledger_entry import LedgerEntry
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.services.idempotency_service import IdempotencyService
from app.services.notification_service import NotificationService
from app.services.setting_service import SettingService
from app.services.transaction_service import TransactionService

MONEY = Decimal("0.01")


class WithdrawalService:
    @staticmethod
    def _decimal_setting(db: Session, key: str, default: str = "0.00") -> Decimal:
        raw = SettingService.get_string(db, key, default)
        try:
            return Decimal(raw).quantize(MONEY, rounding=ROUND_HALF_UP)
        except InvalidOperation as exc:
            raise RuntimeError(f"Invalid decimal setting for {key}: {raw!r}") from exc

    @classmethod
    def calculate_fee(cls, db: Session, amount: Decimal) -> Decimal:
        if amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=400,
                detail="Withdrawal amount must be greater than zero.",
            )

        percent = cls._decimal_setting(
            db,
            SettingKeys.WITHDRAWAL_FEE_PERCENT,
            default="1.00",
        )
        if percent <= Decimal("0.00"):
            raise HTTPException(
                status_code=503,
                detail=(
                    "Withdrawal fee is not configured. "
                    "Set withdrawal_fee_percent to a value greater than zero."
                ),
            )

        percentage_fee = (
            amount * percent / Decimal("100")
        ).quantize(MONEY, rounding=ROUND_HALF_UP)

        # The fee is required. For very small amounts/percentages, protect
        # against currency rounding producing a zero fee.
        return max(MONEY, percentage_fee)

    @classmethod
    def create_request(
        cls,
        db: Session,
        *,
        user: User,
        amount: Decimal,
        destination_bank_name: str,
        destination_account_number: str,
        destination_account_name: str,
        idempotency_key: str,
    ) -> Withdrawal:
        if amount <= Decimal("0.00"):
            raise HTTPException(status_code=400, detail="Withdrawal amount must be greater than zero.")

        payload = {
            "amount": str(amount),
            "destination_bank_name": destination_bank_name.strip(),
            "destination_account_number": destination_account_number.strip(),
            "destination_account_name": destination_account_name.strip(),
        }
        fingerprint = IdempotencyService.fingerprint(payload)
        record, is_new = IdempotencyService.claim(
            db,
            user_id=user.id,
            scope="withdrawal.create",
            key=idempotency_key,
            fingerprint=fingerprint,
        )
        if not is_new:
            if record.resource_type != "withdrawal" or record.resource_id is None:
                raise HTTPException(status_code=409, detail="This withdrawal request is still being resolved.")
            withdrawal = db.get(Withdrawal, record.resource_id)
            if withdrawal is None:
                raise HTTPException(status_code=409, detail="Idempotent withdrawal resource was not found.")
            return withdrawal

        account = db.scalar(select(Account).where(Account.id == user.account.id).with_for_update())
        if account is None:
            raise HTTPException(status_code=404, detail="Account was not found.")
        if account.status != AccountStatus.ACTIVE.value:
            raise HTTPException(status_code=403, detail="Your account is not active.")
        if account.available_balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient available balance.")

        fee = cls.calculate_fee(db, amount)
        # Every withdrawal requires its separately-paid processing fee
        # before it can enter review.
        status = WithdrawalStatus.AWAITING_FEE.value

        account.available_balance -= amount
        account.held_balance += amount

        transaction = TransactionService.create(
            db,
            transaction_type=TransactionType.WITHDRAWAL.value,
            amount=amount,
            currency=account.currency,
            status=TransactionStatus.PENDING.value,
            description="Withdrawal funds reserved",
            prefix="WDR",
        )
        db.add(
            LedgerEntry(
                transaction_id=transaction.id,
                account_id=account.id,
                entry_type=LedgerEntryType.DEBIT.value,
                amount=amount,
                balance_after=account.available_balance,
            )
        )

        item = Withdrawal(
            user_id=user.id,
            account_id=account.id,
            transaction_id=transaction.id,
            amount=amount,
            fee_amount=fee,
            currency=account.currency,
            destination_bank_name=payload["destination_bank_name"],
            destination_account_number=payload["destination_account_number"],
            destination_account_name=payload["destination_account_name"],
            status=status,
        )
        db.add(item)
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=user.id, title="Withdrawal submitted",
            message=f"Your withdrawal request for {item.currency} {item.amount:,.2f} was submitted.",
            event_type="withdrawal.submitted", category="financial", severity="info", action_url="/withdraw",
        )
        IdempotencyService.bind(record, resource_type="withdrawal", resource_id=item.id)
        db.flush()
        return item

    @classmethod
    def _locked(cls, db: Session, withdrawal_id: UUID) -> tuple[Withdrawal, Account]:
        withdrawal = db.scalar(
            select(Withdrawal).where(Withdrawal.id == withdrawal_id).with_for_update()
        )
        if withdrawal is None:
            raise HTTPException(status_code=404, detail="Withdrawal not found.")
        account = db.scalar(
            select(Account).where(Account.id == withdrawal.account_id).with_for_update()
        )
        if account is None:
            raise HTTPException(status_code=409, detail="Withdrawal account was not found.")
        return withdrawal, account

    @staticmethod
    def _audit(
        db: Session,
        *,
        actor: User,
        withdrawal: Withdrawal,
        action: str,
        reason: str | None = None,
        details: dict | None = None,
    ) -> None:
        payload = {
            "status": withdrawal.status,
            "reason": reason,
        }
        if details:
            payload.update(details)

        db.add(
            AuditLog(
                user_id=actor.id,
                action=action,
                entity_type="withdrawal",
                entity_id=withdrawal.id,
                details=payload,
            )
        )

    @staticmethod
    def _verified_fee_payment(
        db: Session,
        withdrawal: Withdrawal,
    ) -> Payment | None:
        return db.scalar(
            select(Payment)
            .where(
                Payment.withdrawal_id == withdrawal.id,
                Payment.status == PaymentStatus.PAID.value,
                Payment.amount == withdrawal.fee_amount,
                Payment.currency == withdrawal.currency,
            )
            .order_by(Payment.paid_at.desc().nullslast())
        )

    @classmethod
    def _release_hold(
        cls,
        db: Session,
        *,
        withdrawal: Withdrawal,
        account: Account,
        final_status: WithdrawalStatus,
        reason: str,
    ) -> None:
        if account.held_balance < withdrawal.amount:
            raise HTTPException(status_code=409, detail="Held balance is inconsistent for this withdrawal.")
        account.held_balance -= withdrawal.amount
        account.available_balance += withdrawal.amount

        reversal = TransactionService.create(
            db,
            transaction_type=TransactionType.WITHDRAWAL_RELEASE.value,
            amount=withdrawal.amount,
            currency=withdrawal.currency,
            status=TransactionStatus.COMPLETED.value,
            description=f"Withdrawal hold released: {reason}",
            prefix="WRL",
        )
        db.add(
            LedgerEntry(
                transaction_id=reversal.id,
                account_id=account.id,
                entry_type=LedgerEntryType.CREDIT.value,
                amount=withdrawal.amount,
                balance_after=account.available_balance,
            )
        )
        if withdrawal.transaction_id:
            original = db.get(Transaction, withdrawal.transaction_id)
            if original is not None:
                original.status = TransactionStatus.REVERSED.value
        withdrawal.status = final_status.value

    @classmethod
    def cancel_by_user(cls, db: Session, *, user: User, withdrawal_id: UUID) -> Withdrawal:
        withdrawal, account = cls._locked(db, withdrawal_id)
        if withdrawal.user_id != user.id:
            raise HTTPException(status_code=404, detail="Withdrawal not found.")
        allowed = {
            WithdrawalStatus.AWAITING_FEE.value,
            WithdrawalStatus.PENDING_REVIEW.value,
            WithdrawalStatus.PENDING.value,
        }
        if withdrawal.status not in allowed:
            raise HTTPException(status_code=409, detail="This withdrawal can no longer be cancelled by the user.")
        cls._release_hold(
            db,
            withdrawal=withdrawal,
            account=account,
            final_status=WithdrawalStatus.CANCELLED,
            reason="cancelled by user",
        )
        cls._audit(db, actor=user, withdrawal=withdrawal, action="withdrawal.cancelled_by_user")
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=user.id, title="Withdrawal cancelled",
            message=f"Your withdrawal of {withdrawal.currency} {withdrawal.amount:,.2f} was cancelled and the hold was released.",
            event_type="withdrawal.cancelled", category="financial", severity="info", action_url="/withdraw",
        )
        return withdrawal

    @classmethod
    def approve(
        cls,
        db: Session,
        *,
        admin: User,
        withdrawal_id: UUID,
        admin_note: str | None = None,
    ) -> Withdrawal:
        if not admin.is_admin:
            raise HTTPException(status_code=403, detail="Administrator access is required.")

        withdrawal, account = cls._locked(db, withdrawal_id)

        if account.status != AccountStatus.ACTIVE.value:
            raise HTTPException(status_code=409, detail="The withdrawal account is not active.")

        if withdrawal.status not in {
            WithdrawalStatus.FEE_PAID.value,
            WithdrawalStatus.PENDING_REVIEW.value,
            WithdrawalStatus.PENDING.value,
        }:
            raise HTTPException(status_code=409, detail="Withdrawal is not ready for approval.")

        # `pending_review` / `fee_paid` is the lifecycle state produced by
        # successful provider verification. Payment verification itself is
        # owned by PaymentService; approval must not require a second,
        # independently queried payment-row contract here.
        fee_payment = cls._verified_fee_payment(db, withdrawal)

        withdrawal.status = WithdrawalStatus.PROCESSING.value
        withdrawal.admin_note = admin_note.strip() if admin_note else None

        audit_details = {
            "admin_note": withdrawal.admin_note,
        }
        if fee_payment is not None:
            audit_details.update(
                {
                    "fee_payment_id": str(fee_payment.id),
                    "fee_payment_reference": fee_payment.provider_reference,
                }
            )

        cls._audit(
            db,
            actor=admin,
            withdrawal=withdrawal,
            action="withdrawal.approved",
            details=audit_details,
        )
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=withdrawal.user_id, title="Withdrawal approved",
            message=f"Your withdrawal of {withdrawal.currency} {withdrawal.amount:,.2f} was approved and is processing.",
            event_type="withdrawal.processing", category="financial", severity="success", action_url="/withdraw",
        )
        return withdrawal

    @classmethod
    def complete(
        cls,
        db: Session,
        *,
        admin: User,
        withdrawal_id: UUID,
        external_reference: str | None = None,
        admin_note: str | None = None,
    ) -> Withdrawal:
        if not admin.is_admin:
            raise HTTPException(status_code=403, detail="Administrator access is required.")

        reference = (
            external_reference.strip()
            if external_reference is not None
            else None
        )

        withdrawal, account = cls._locked(db, withdrawal_id)

        if withdrawal.status != WithdrawalStatus.PROCESSING.value:
            raise HTTPException(status_code=409, detail="Only processing withdrawals can be completed.")

        if account.held_balance < withdrawal.amount:
            raise HTTPException(status_code=409, detail="Held balance is inconsistent for this withdrawal.")

        account.held_balance -= withdrawal.amount
        withdrawal.status = WithdrawalStatus.COMPLETED.value
        if reference:
            withdrawal.external_reference = reference
        withdrawal.admin_note = admin_note.strip() if admin_note else withdrawal.admin_note

        if withdrawal.transaction_id:
            transaction = db.get(Transaction, withdrawal.transaction_id)
            if transaction is not None:
                transaction.status = TransactionStatus.COMPLETED.value

        cls._audit(
            db,
            actor=admin,
            withdrawal=withdrawal,
            action="withdrawal.completed",
            details={
                "external_reference": reference,
                "admin_note": withdrawal.admin_note,
            },
        )
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=withdrawal.user_id, title="Withdrawal completed",
            message=f"Your withdrawal of {withdrawal.currency} {withdrawal.amount:,.2f} was completed.",
            event_type="withdrawal.completed", category="financial", severity="success", action_url="/withdraw",
        )
        return withdrawal

    @classmethod
    def reject(
        cls,
        db: Session,
        *,
        admin: User,
        withdrawal_id: UUID,
        reason: str,
    ) -> Withdrawal:
        if not admin.is_admin:
            raise HTTPException(status_code=403, detail="Administrator access is required.")
        withdrawal, account = cls._locked(db, withdrawal_id)
        if withdrawal.status not in {
            WithdrawalStatus.FEE_PAID.value,
            WithdrawalStatus.PENDING_REVIEW.value,
            WithdrawalStatus.PENDING.value,
        }:
            raise HTTPException(
                status_code=409,
                detail="Only withdrawals awaiting review can be rejected.",
            )
        cls._release_hold(
            db,
            withdrawal=withdrawal,
            account=account,
            final_status=WithdrawalStatus.REJECTED,
            reason=reason,
        )
        withdrawal.admin_note = reason.strip()
        cls._audit(
            db,
            actor=admin,
            withdrawal=withdrawal,
            action="withdrawal.rejected",
            reason=reason,
        )
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=withdrawal.user_id, title="Withdrawal rejected",
            message=f"Your withdrawal of {withdrawal.currency} {withdrawal.amount:,.2f} was rejected. Reserved funds were returned.",
            event_type="withdrawal.rejected", category="financial", severity="danger", action_url="/withdraw",
        )
        return withdrawal

    @classmethod
    def fail(
        cls,
        db: Session,
        *,
        admin: User,
        withdrawal_id: UUID,
        reason: str,
    ) -> Withdrawal:
        if not admin.is_admin:
            raise HTTPException(status_code=403, detail="Administrator access is required.")
        withdrawal, account = cls._locked(db, withdrawal_id)
        if withdrawal.status != WithdrawalStatus.PROCESSING.value:
            raise HTTPException(status_code=409, detail="Only processing withdrawals can be failed.")
        cls._release_hold(
            db,
            withdrawal=withdrawal,
            account=account,
            final_status=WithdrawalStatus.FAILED,
            reason=reason,
        )
        withdrawal.admin_note = reason.strip()
        cls._audit(
            db,
            actor=admin,
            withdrawal=withdrawal,
            action="withdrawal.failed",
            reason=reason,
        )
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=withdrawal.user_id, title="Withdrawal failed",
            message=f"Your withdrawal of {withdrawal.currency} {withdrawal.amount:,.2f} failed. Reserved funds were returned.",
            event_type="withdrawal.failed", category="financial", severity="danger", action_url="/withdraw",
        )
        return withdrawal
