from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, select

from app.models.account import Account
from app.models.ledger_entry import LedgerEntry
from app.models.transfer import Transfer
from app.models.user import User
from app.services.reconciliation_service import ReconciliationService
from app.services.transfer_service import TransferService
from tests.integration.helpers import make_user


def test_transfer_persists_balances_and_double_entry_ledger(db) -> None:
    sender = make_user(
        db,
        email="sender@example.test",
        account_number="1000000001",
        balance=Decimal("100.00"),
    )
    recipient = make_user(
        db,
        email="recipient@example.test",
        account_number="1000000002",
    )

    transfer, _ = TransferService.create_transfer(
        db,
        user=sender,
        recipient_account_number=recipient.account.account_number,
        amount=Decimal("35.00"),
        narration="integration transfer",
        idempotency_key=str(uuid4()),
    )
    db.commit()
    db.expire_all()

    sender_account = db.get(Account, sender.account.id)
    recipient_account = db.get(Account, recipient.account.id)
    entries = db.scalars(
        select(LedgerEntry).where(LedgerEntry.transaction_id == transfer.transaction_id)
    ).all()

    assert sender_account.available_balance == Decimal("65.00")
    assert recipient_account.available_balance == Decimal("35.00")
    assert len(entries) == 2
    assert sum(1 for entry in entries if entry.account_id == sender_account.id) == 1
    assert sum(1 for entry in entries if entry.account_id == recipient_account.id) == 1

    sender_reconciliation = ReconciliationService.account(db, sender_account)
    recipient_reconciliation = ReconciliationService.account(db, recipient_account)
    assert sender_reconciliation["available_matches"] is True
    assert recipient_reconciliation["available_matches"] is True


def test_concurrent_transfers_cannot_double_spend(session_factory) -> None:
    setup = session_factory()
    sender = make_user(
        setup,
        email="race-sender@example.test",
        account_number="2000000001",
        balance=Decimal("100.00"),
    )
    first = make_user(setup, email="race-a@example.test", account_number="2000000002")
    second = make_user(setup, email="race-b@example.test", account_number="2000000003")
    sender_id = sender.id
    recipient_numbers = [first.account.account_number, second.account.account_number]
    setup.close()

    barrier = Barrier(2)

    def worker(recipient_number: str) -> str:
        db = session_factory()
        try:
            user = db.get(User, sender_id)
            barrier.wait(timeout=10)
            try:
                TransferService.create_transfer(
                    db,
                    user=user,
                    recipient_account_number=recipient_number,
                    amount=Decimal("80.00"),
                    idempotency_key=str(uuid4()),
                )
                db.commit()
                return "success"
            except HTTPException as exc:
                db.rollback()
                return f"http:{exc.status_code}:{exc.detail}"
        finally:
            db.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(worker, recipient_numbers))

    assert results.count("success") == 1
    assert sum(result.startswith("http:400:Insufficient") for result in results) == 1

    verify = session_factory()
    try:
        sender_account = verify.scalar(select(Account).where(Account.user_id == sender_id))
        assert sender_account.available_balance == Decimal("20.00")
        assert verify.scalar(select(func.count(Transfer.id))) == 1
    finally:
        verify.close()


def test_same_idempotency_key_returns_same_transfer_without_second_debit(db) -> None:
    sender = make_user(
        db,
        email="idem-sender@example.test",
        account_number="3000000001",
        balance=Decimal("100.00"),
    )
    recipient = make_user(db, email="idem-recipient@example.test", account_number="3000000002")
    key = str(uuid4())

    first, _ = TransferService.create_transfer(
        db,
        user=sender,
        recipient_account_number=recipient.account.account_number,
        amount=Decimal("25.00"),
        narration="same request",
        idempotency_key=key,
    )
    db.commit()

    db.expire_all()
    sender = db.get(User, sender.id)
    second, _ = TransferService.create_transfer(
        db,
        user=sender,
        recipient_account_number=recipient.account.account_number,
        amount=Decimal("25.00"),
        narration="same request",
        idempotency_key=key,
    )
    db.commit()

    assert second.id == first.id
    account = db.get(Account, sender.account.id)
    assert account.available_balance == Decimal("75.00")
    assert db.scalar(select(func.count(Transfer.id))) == 1


def test_same_idempotency_key_with_changed_payload_is_rejected(db) -> None:
    sender = make_user(
        db,
        email="idem-conflict@example.test",
        account_number="3100000001",
        balance=Decimal("100.00"),
    )
    recipient = make_user(db, email="idem-conflict-r@example.test", account_number="3100000002")
    key = str(uuid4())

    TransferService.create_transfer(
        db,
        user=sender,
        recipient_account_number=recipient.account.account_number,
        amount=Decimal("10.00"),
        idempotency_key=key,
    )
    db.commit()

    db.expire_all()
    sender = db.get(User, sender.id)
    try:
        TransferService.create_transfer(
            db,
            user=sender,
            recipient_account_number=recipient.account.account_number,
            amount=Decimal("11.00"),
            idempotency_key=key,
        )
    except HTTPException as exc:
        assert exc.status_code == 409
    else:
        raise AssertionError("Reusing an idempotency key with different data should fail")


def test_concurrent_same_idempotency_key_creates_one_transfer(session_factory) -> None:
    setup = session_factory()
    sender = make_user(
        setup,
        email="race-idem-sender@example.test",
        account_number="3200000001",
        balance=Decimal("100.00"),
    )
    recipient = make_user(
        setup,
        email="race-idem-recipient@example.test",
        account_number="3200000002",
    )
    sender_id = sender.id
    recipient_number = recipient.account.account_number
    setup.close()

    barrier = Barrier(2)
    key = str(uuid4())

    def worker() -> str:
        db = session_factory()
        try:
            user = db.get(User, sender_id)
            barrier.wait(timeout=10)
            transfer, _ = TransferService.create_transfer(
                db,
                user=user,
                recipient_account_number=recipient_number,
                amount=Decimal("25.00"),
                narration="same concurrent request",
                idempotency_key=key,
            )
            transfer_id = str(transfer.id)
            db.commit()
            return transfer_id
        finally:
            db.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda _: worker(), range(2)))

    assert results[0] == results[1]

    verify = session_factory()
    try:
        sender_account = verify.scalar(select(Account).where(Account.user_id == sender_id))
        assert sender_account.available_balance == Decimal("75.00")
        assert verify.scalar(select(func.count(Transfer.id))) == 1
    finally:
        verify.close()
