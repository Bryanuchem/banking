from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.models.user import User
from app.models.withdrawal import Withdrawal


class AdminQueryService:
    @staticmethod
    def _page(db: Session, stmt, model, *, limit: int, offset: int):
        total = db.scalar(select(func.count()).select_from(model)) or 0
        items = list(db.scalars(stmt.limit(limit).offset(offset)).all())
        return items, int(total)

    @classmethod
    def users(cls, db: Session, *, q: str | None, limit: int, offset: int):
        stmt = select(User).order_by(User.created_at.desc())
        count_stmt = select(func.count()).select_from(User)
        if q:
            term = f"%{q.strip()}%"
            predicate = or_(
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                User.phone.ilike(term),
            )
            stmt = stmt.where(predicate)
            count_stmt = count_stmt.where(predicate)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @classmethod
    def accounts(cls, db: Session, *, status: str | None, limit: int, offset: int):
        stmt = select(Account).order_by(Account.created_at.desc())
        count_stmt = select(func.count()).select_from(Account)
        if status:
            stmt = stmt.where(Account.status == status)
            count_stmt = count_stmt.where(Account.status == status)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @classmethod
    def transactions(cls, db: Session, *, status: str | None, tx_type: str | None, limit: int, offset: int):
        stmt = select(Transaction).order_by(Transaction.created_at.desc())
        count_stmt = select(func.count()).select_from(Transaction)
        if status:
            stmt = stmt.where(Transaction.status == status)
            count_stmt = count_stmt.where(Transaction.status == status)
        if tx_type:
            stmt = stmt.where(Transaction.type == tx_type)
            count_stmt = count_stmt.where(Transaction.type == tx_type)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @classmethod
    def withdrawals(cls, db: Session, *, status: str | None, limit: int, offset: int):
        stmt = select(Withdrawal).order_by(Withdrawal.created_at.desc())
        count_stmt = select(func.count()).select_from(Withdrawal)
        if status:
            stmt = stmt.where(Withdrawal.status == status)
            count_stmt = count_stmt.where(Withdrawal.status == status)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @classmethod
    def payments(cls, db: Session, *, status: str | None, provider: str | None, limit: int, offset: int):
        stmt = select(Payment).order_by(Payment.created_at.desc())
        count_stmt = select(func.count()).select_from(Payment)
        if status:
            stmt = stmt.where(Payment.status == status)
            count_stmt = count_stmt.where(Payment.status == status)
        if provider:
            stmt = stmt.where(Payment.provider == provider)
            count_stmt = count_stmt.where(Payment.provider == provider)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)

    @classmethod
    def audit_logs(cls, db: Session, *, action: str | None, limit: int, offset: int):
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
        count_stmt = select(func.count()).select_from(AuditLog)
        if action:
            stmt = stmt.where(AuditLog.action == action)
            count_stmt = count_stmt.where(AuditLog.action == action)
        total = db.scalar(count_stmt) or 0
        return list(db.scalars(stmt.limit(limit).offset(offset)).all()), int(total)
