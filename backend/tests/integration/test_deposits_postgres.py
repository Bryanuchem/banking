from decimal import Decimal
from sqlalchemy import func, select
from app.enums.deposit_status import DepositStatus
from app.enums.payment_provider import PaymentProvider
from app.enums.payment_status import PaymentStatus
from app.enums.transaction_type import TransactionType
from app.models.deposit import Deposit
from app.models.ledger_entry import LedgerEntry
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.services.deposit_service import DepositService
from tests.integration.helpers import make_user

def _make(db):
    user=make_user(db,email="deposit@example.test",account_number="4300000001",balance=Decimal("100.00"))
    deposit=Deposit(user_id=user.id,account_id=user.account.id,amount=Decimal("25.00"),currency="USD",status=DepositStatus.AWAITING_PAYMENT.value);db.add(deposit);db.flush()
    payment=Payment(user_id=user.id,deposit_id=deposit.id,provider=PaymentProvider.PAYSTACK,internal_reference="PAY-DEPOSIT-INTEGRATION",provider_reference="provider-deposit-integration",amount=Decimal("25.00"),currency="USD",status=PaymentStatus.PAID.value);db.add(payment);db.flush();return user,deposit,payment

def test_verified_deposit_credits_account_once(db):
    user,deposit,payment=_make(db);DepositService.complete_verified_payment(db,deposit_id=deposit.id,payment=payment);DepositService.complete_verified_payment(db,deposit_id=deposit.id,payment=payment);db.commit();db.expire_all();db.refresh(user.account);db.refresh(deposit)
    assert user.account.available_balance==Decimal("125.00");assert deposit.status==DepositStatus.COMPLETED.value;assert deposit.transaction_id is not None
    transaction=db.get(Transaction,deposit.transaction_id);assert transaction is not None;assert transaction.type==TransactionType.DEPOSIT.value
    assert db.scalar(select(func.count(LedgerEntry.id)).where(LedgerEntry.transaction_id==deposit.transaction_id))==1

def test_second_paid_provider_attempt_cannot_double_credit(db):
    user,deposit,first=_make(db);DepositService.complete_verified_payment(db,deposit_id=deposit.id,payment=first)
    second=Payment(user_id=user.id,deposit_id=deposit.id,provider=PaymentProvider.STRIPE,internal_reference="PAY-DEPOSIT-SECOND",provider_reference="provider-deposit-second",amount=Decimal("25.00"),currency="USD",status=PaymentStatus.PAID.value);db.add(second);db.flush();DepositService.complete_verified_payment(db,deposit_id=deposit.id,payment=second);db.commit();db.expire_all();db.refresh(user.account);assert user.account.available_balance==Decimal("125.00")
