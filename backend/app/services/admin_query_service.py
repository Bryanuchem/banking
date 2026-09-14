from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, aliased, joinedload, selectinload

from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.deposit import Deposit
from app.models.ledger_entry import LedgerEntry
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.models.transfer import Transfer
from app.models.user import User
from app.models.withdrawal import Withdrawal


class AdminQueryService:
    @classmethod
    def users(cls, db: Session, *, q: str | None, limit: int, offset: int):
        stmt = (
            select(User)
            .join(Account, Account.user_id == User.id)
            .where(Account.deleted_at.is_(None))
            .order_by(User.created_at.desc())
        )
        count_stmt = (
            select(func.count())
            .select_from(User)
            .join(Account, Account.user_id == User.id)
            .where(Account.deleted_at.is_(None))
        )
        if q:
            term = f"%{q.strip()}%"
            predicate = or_(
                User.email.ilike(term), User.first_name.ilike(term),
                User.last_name.ilike(term), User.phone.ilike(term),
                Account.account_number.ilike(term),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @staticmethod
    def user_detail(db: Session, *, user_id: UUID) -> User | None:
        return db.scalar(
            select(User)
            .join(Account, Account.user_id == User.id)
            .where(Account.deleted_at.is_(None), User.id == user_id)
            .options(joinedload(User.account))
        )

    @classmethod
    def accounts(cls, db: Session, *, q: str | None, status: str | None, limit: int, offset: int):
        stmt = (
            select(Account)
            .options(joinedload(Account.user))
            .where(Account.deleted_at.is_(None))
        )
        count_stmt = select(func.count()).select_from(Account).where(Account.deleted_at.is_(None))
        if q:
            term = f"%{q.strip()}%"
            stmt = stmt.join(User, Account.user_id == User.id)
            count_stmt = count_stmt.join(User, Account.user_id == User.id)
            predicate = or_(
                Account.account_number.ilike(term), User.email.ilike(term),
                User.first_name.ilike(term), User.last_name.ilike(term),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)
        if status:
            stmt = stmt.where(Account.status == status)
            count_stmt = count_stmt.where(Account.status == status)
        stmt = stmt.order_by(Account.created_at.desc())
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @staticmethod
    def account_detail(db: Session, *, account_id: UUID) -> Account | None:
        return db.scalar(select(Account).options(joinedload(Account.user)).where(Account.id == account_id))

    @staticmethod
    def _dashboard_range(
        start_date: date | None,
        end_date: date | None,
    ) -> tuple[date, date, datetime, datetime]:
        today = datetime.now(UTC).date()
        start = start_date or today
        end = end_date or start
        if end < start:
            raise ValueError("end_date must be on or after start_date")

        start_dt = datetime.combine(start, time.min, tzinfo=UTC)
        end_exclusive = datetime.combine(
            end + timedelta(days=1),
            time.min,
            tzinfo=UTC,
        )
        return start, end, start_dt, end_exclusive

    @classmethod
    def dashboard_summary(
        cls,
        db: Session,
        *,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict:
        customer_total = int(db.scalar(
            select(func.count()).select_from(User).join(Account, Account.user_id == User.id)
            .where(Account.deleted_at.is_(None))
        ) or 0)
        customer_active = int(db.scalar(
            select(func.count()).select_from(User).join(Account, Account.user_id == User.id)
            .where(Account.deleted_at.is_(None), User.is_active.is_(True))
        ) or 0)
        account_total = int(db.scalar(
            select(func.count()).select_from(Account).where(Account.deleted_at.is_(None))
        ) or 0)

        def account_count(status: str) -> int:
            return int(db.scalar(
                select(func.count()).select_from(Account)
                .where(Account.deleted_at.is_(None), Account.status == status)
            ) or 0)

        period_start, period_end, start_dt, end_exclusive = cls._dashboard_range(
            start_date,
            end_date,
        )

        def range_count(model) -> int:
            return int(
                db.scalar(
                    select(func.count())
                    .select_from(model)
                    .where(
                        model.created_at >= start_dt,
                        model.created_at < end_exclusive,
                    )
                )
                or 0
            )

        pending_review = int(
            db.scalar(
                select(func.count())
                .select_from(Withdrawal)
                .where(
                    Withdrawal.status.in_(
                        ["pending_review", "fee_paid", "pending"]
                    )
                )
            )
            or 0
        )
        processing_withdrawals = int(
            db.scalar(
                select(func.count())
                .select_from(Withdrawal)
                .where(Withdrawal.status == "processing")
            )
            or 0
        )

        return {
            "customers": {
                "total": customer_total,
                "active": customer_active,
                "inactive": max(customer_total - customer_active, 0),
            },
            "accounts": {
                "total": account_total,
                "active": account_count("active"),
                "frozen": account_count("frozen"),
                "closed": account_count("closed"),
            },
            "financial": {
                "period_start": period_start,
                "period_end": period_end,
                "transactions_count": range_count(Transaction),
                "payments_count": range_count(Payment),
                "transfers_count": range_count(Transfer),
                "deposits_count": range_count(Deposit),
            },
            "withdrawals": {
                "pending_review": pending_review,
                "processing": processing_withdrawals,
            },
        }

    @classmethod
    def transactions(cls, db: Session, *, q: str | None, status: str | None, tx_type: str | None, limit: int, offset: int):
        stmt = select(Transaction).options(
            selectinload(Transaction.ledger_entries)
            .joinedload(LedgerEntry.account)
            .joinedload(Account.user)
        )
        count_stmt = select(func.count(func.distinct(Transaction.id))).select_from(Transaction)
        if q:
            term = f"%{q.strip()}%"
            stmt = stmt.join(LedgerEntry, LedgerEntry.transaction_id == Transaction.id).join(Account, Account.id == LedgerEntry.account_id).join(User, User.id == Account.user_id)
            count_stmt = count_stmt.join(LedgerEntry, LedgerEntry.transaction_id == Transaction.id).join(Account, Account.id == LedgerEntry.account_id).join(User, User.id == Account.user_id)
            pred = or_(
                Transaction.reference.ilike(term), Transaction.description.ilike(term),
                Account.account_number.ilike(term), User.email.ilike(term),
                User.first_name.ilike(term), User.last_name.ilike(term),
            )
            stmt = stmt.where(pred).distinct()
            count_stmt = count_stmt.where(pred)
        if status:
            stmt = stmt.where(Transaction.status == status); count_stmt = count_stmt.where(Transaction.status == status)
        if tx_type:
            stmt = stmt.where(Transaction.type == tx_type); count_stmt = count_stmt.where(Transaction.type == tx_type)
        total = db.scalar(count_stmt) or 0
        stmt = stmt.order_by(Transaction.created_at.desc())
        return list(db.scalars(stmt.limit(limit).offset(offset)).unique().all()), int(total)

    @staticmethod
    def transaction_detail(db: Session, *, transaction_id: UUID) -> Transaction | None:
        return db.scalar(
            select(Transaction).options(
                selectinload(Transaction.ledger_entries)
                .joinedload(LedgerEntry.account)
                .joinedload(Account.user)
            ).where(Transaction.id == transaction_id)
        )

    @classmethod
    def recent_transactions(
        cls,
        db: Session,
        *,
        limit: int = 5,
        start_date: date | None = None,
        end_date: date | None = None,
    ):
        _, _, start_dt, end_exclusive = cls._dashboard_range(
            start_date,
            end_date,
        )
        return list(
            db.scalars(
                select(Transaction)
                .options(
                    selectinload(Transaction.ledger_entries)
                    .joinedload(LedgerEntry.account)
                    .joinedload(Account.user)
                )
                .where(
                    Transaction.created_at >= start_dt,
                    Transaction.created_at < end_exclusive,
                )
                .order_by(Transaction.created_at.desc())
                .limit(limit)
            )
            .unique()
            .all()
        )

    @classmethod
    def transfers(cls, db: Session, *, q: str | None, status: str | None, limit: int, offset: int):
        SenderAccount = aliased(Account)
        RecipientAccount = aliased(Account)
        SenderUser = aliased(User)
        RecipientUser = aliased(User)
        stmt = select(Transfer).options(
            joinedload(Transfer.transaction).selectinload(Transaction.ledger_entries).joinedload(LedgerEntry.account),
            joinedload(Transfer.sender_account).joinedload(Account.user),
            joinedload(Transfer.recipient_account).joinedload(Account.user),
        )
        count_stmt = select(func.count(func.distinct(Transfer.id))).select_from(Transfer)
        if q:
            term = f"%{q.strip()}%"
            joins = [
                (Transaction, Transaction.id == Transfer.transaction_id),
                (SenderAccount, SenderAccount.id == Transfer.sender_account_id),
                (RecipientAccount, RecipientAccount.id == Transfer.recipient_account_id),
                (SenderUser, SenderUser.id == SenderAccount.user_id),
                (RecipientUser, RecipientUser.id == RecipientAccount.user_id),
            ]
            for model, on_clause in joins:
                stmt = stmt.join(model, on_clause); count_stmt = count_stmt.join(model, on_clause)
            pred = or_(
                Transaction.reference.ilike(term), Transfer.narration.ilike(term),
                SenderAccount.account_number.ilike(term), RecipientAccount.account_number.ilike(term),
                SenderUser.email.ilike(term), RecipientUser.email.ilike(term),
                SenderUser.first_name.ilike(term), SenderUser.last_name.ilike(term),
                RecipientUser.first_name.ilike(term), RecipientUser.last_name.ilike(term),
            )
            stmt = stmt.where(pred); count_stmt = count_stmt.where(pred)
        if status:
            stmt = stmt.join(Transaction, Transaction.id == Transfer.transaction_id) if not q else stmt
            count_stmt = count_stmt.join(Transaction, Transaction.id == Transfer.transaction_id) if not q else count_stmt
            stmt = stmt.where(Transaction.status == status); count_stmt = count_stmt.where(Transaction.status == status)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.order_by(Transfer.created_at.desc()).limit(limit).offset(offset)).unique().all()), int(total)

    @staticmethod
    def transfer_detail(db: Session, *, transfer_id: UUID) -> Transfer | None:
        return db.scalar(
            select(Transfer).options(
                joinedload(Transfer.transaction).selectinload(Transaction.ledger_entries).joinedload(LedgerEntry.account),
                joinedload(Transfer.sender_account).joinedload(Account.user),
                joinedload(Transfer.recipient_account).joinedload(Account.user),
            ).where(Transfer.id == transfer_id)
        )

    @classmethod
    def deposits(cls, db: Session, *, q: str | None, status: str | None, provider: str | None, limit: int, offset: int):
        stmt = select(Deposit).options(
            joinedload(Deposit.user), joinedload(Deposit.account), joinedload(Deposit.transaction), selectinload(Deposit.payments)
        )
        count_stmt = select(func.count(func.distinct(Deposit.id))).select_from(Deposit)
        payment_joined = False
        if q:
            term = f"%{q.strip()}%"
            stmt = stmt.join(User, User.id == Deposit.user_id).join(Account, Account.id == Deposit.account_id).outerjoin(Transaction, Transaction.id == Deposit.transaction_id).outerjoin(Payment, Payment.deposit_id == Deposit.id)
            count_stmt = count_stmt.join(User, User.id == Deposit.user_id).join(Account, Account.id == Deposit.account_id).outerjoin(Transaction, Transaction.id == Deposit.transaction_id).outerjoin(Payment, Payment.deposit_id == Deposit.id)
            payment_joined = True
            pred = or_(
                User.email.ilike(term), User.first_name.ilike(term), User.last_name.ilike(term),
                Account.account_number.ilike(term), Transaction.reference.ilike(term),
                Payment.internal_reference.ilike(term), Payment.provider_reference.ilike(term),
            )
            stmt = stmt.where(pred); count_stmt = count_stmt.where(pred)
        if status:
            stmt = stmt.where(Deposit.status == status); count_stmt = count_stmt.where(Deposit.status == status)
        if provider:
            if not payment_joined:
                stmt = stmt.join(Payment, Payment.deposit_id == Deposit.id)
                count_stmt = count_stmt.join(Payment, Payment.deposit_id == Deposit.id)
            stmt = stmt.where(Payment.provider == provider); count_stmt = count_stmt.where(Payment.provider == provider)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.order_by(Deposit.created_at.desc()).limit(limit).offset(offset)).unique().all()), int(total)

    @staticmethod
    def deposit_detail(db: Session, *, deposit_id: UUID) -> Deposit | None:
        return db.scalar(
            select(Deposit).options(
                joinedload(Deposit.user), joinedload(Deposit.account),
                joinedload(Deposit.transaction).selectinload(Transaction.ledger_entries).joinedload(LedgerEntry.account),
                selectinload(Deposit.payments),
            ).where(Deposit.id == deposit_id)
        )

    @classmethod
    def payments(cls, db: Session, *, q: str | None, purpose: str | None, status: str | None, provider: str | None, limit: int, offset: int):
        stmt = select(Payment).options(joinedload(Payment.user), joinedload(Payment.deposit), joinedload(Payment.withdrawal))
        count_stmt = select(func.count()).select_from(Payment)
        if q:
            term = f"%{q.strip()}%"
            stmt = stmt.join(User, User.id == Payment.user_id)
            count_stmt = count_stmt.join(User, User.id == Payment.user_id)
            pred = or_(
                Payment.internal_reference.ilike(term), Payment.provider_reference.ilike(term),
                User.email.ilike(term), User.first_name.ilike(term), User.last_name.ilike(term),
            )
            stmt = stmt.where(pred); count_stmt = count_stmt.where(pred)
        if purpose == "deposit":
            stmt = stmt.where(Payment.deposit_id.is_not(None)); count_stmt = count_stmt.where(Payment.deposit_id.is_not(None))
        elif purpose == "withdrawal_fee":
            stmt = stmt.where(Payment.withdrawal_id.is_not(None)); count_stmt = count_stmt.where(Payment.withdrawal_id.is_not(None))
        if status:
            stmt = stmt.where(Payment.status == status); count_stmt = count_stmt.where(Payment.status == status)
        if provider:
            stmt = stmt.where(Payment.provider == provider); count_stmt = count_stmt.where(Payment.provider == provider)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.order_by(Payment.created_at.desc()).limit(limit).offset(offset)).unique().all()), int(total)

    @staticmethod
    def payment_detail(db: Session, *, payment_id: UUID) -> Payment | None:
        return db.scalar(
            select(Payment).options(joinedload(Payment.user), joinedload(Payment.deposit), joinedload(Payment.withdrawal))
            .where(Payment.id == payment_id)
        )

    @classmethod
    def withdrawals(
        cls,
        db: Session,
        *,
        q: str | None,
        status: str | None,
        start_date: date | None,
        end_date: date | None,
        limit: int,
        offset: int,
    ):
        stmt = select(Withdrawal).options(
            joinedload(Withdrawal.user),
            joinedload(Withdrawal.account),
        )
        count_stmt = select(func.count()).select_from(Withdrawal)

        user_joined = False
        account_joined = False

        if q:
            term = f"%{q.strip()}%"
            stmt = stmt.join(User, User.id == Withdrawal.user_id)
            count_stmt = count_stmt.join(User, User.id == Withdrawal.user_id)
            user_joined = True
            stmt = stmt.join(Account, Account.id == Withdrawal.account_id)
            count_stmt = count_stmt.join(Account, Account.id == Withdrawal.account_id)
            account_joined = True

            predicate = or_(
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                Account.account_number.ilike(term),
                Withdrawal.destination_account_number.ilike(term),
                Withdrawal.destination_bank_name.ilike(term),
                Withdrawal.external_reference.ilike(term),
            )

            try:
                parsed_id = UUID(q.strip())
            except (ValueError, AttributeError):
                parsed_id = None
            if parsed_id is not None:
                predicate = or_(predicate, Withdrawal.id == parsed_id)

            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)

        if status:
            if status == "pending_review":
                values = ["pending_review", "fee_paid", "pending"]
                stmt = stmt.where(Withdrawal.status.in_(values))
                count_stmt = count_stmt.where(Withdrawal.status.in_(values))
            else:
                stmt = stmt.where(Withdrawal.status == status)
                count_stmt = count_stmt.where(Withdrawal.status == status)

        if start_date or end_date:
            start = start_date or datetime.now(UTC).date()
            end = end_date or start
            _, _, start_dt, end_exclusive = cls._dashboard_range(start, end)
            stmt = stmt.where(
                Withdrawal.created_at >= start_dt,
                Withdrawal.created_at < end_exclusive,
            )
            count_stmt = count_stmt.where(
                Withdrawal.created_at >= start_dt,
                Withdrawal.created_at < end_exclusive,
            )

        total = db.scalar(count_stmt) or 0
        items = list(
            db.scalars(
                stmt.order_by(Withdrawal.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            .unique()
            .all()
        )
        return items, int(total)

    @staticmethod
    def withdrawal_detail(
        db: Session,
        *,
        withdrawal_id: UUID,
    ) -> Withdrawal | None:
        return db.scalar(
            select(Withdrawal)
            .options(
                joinedload(Withdrawal.user),
                joinedload(Withdrawal.account),
                joinedload(Withdrawal.transaction),
                selectinload(Withdrawal.payments),
            )
            .where(Withdrawal.id == withdrawal_id)
        )

    @staticmethod
    def withdrawal_activity(
        db: Session,
        *,
        withdrawal_id: UUID,
    ) -> list[AuditLog]:
        return list(
            db.scalars(
                select(AuditLog)
                .options(joinedload(AuditLog.user))
                .where(
                    AuditLog.entity_type == "withdrawal",
                    AuditLog.entity_id == withdrawal_id,
                )
                .order_by(AuditLog.created_at.asc())
            ).all()
        )

    @classmethod
    def audit_logs(cls, db: Session, *, action: str | None, limit: int, offset: int):
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
        count_stmt = select(func.count()).select_from(AuditLog)
        if action:
            stmt = stmt.where(AuditLog.action == action); count_stmt = count_stmt.where(AuditLog.action == action)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)
