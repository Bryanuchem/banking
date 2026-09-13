from __future__ import annotations

from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.account import Account
from app.models.idempotency_record import IdempotencyRecord
from tests.integration.helpers import make_user


def test_account_number_unique_constraint_is_enforced_by_postgres(db) -> None:
    make_user(db, email="unique-a@example.test", account_number="7000000001")
    with pytest.raises(IntegrityError):
        make_user(db, email="unique-b@example.test", account_number="7000000001")
    db.rollback()


def test_idempotency_unique_constraint_is_enforced_by_postgres(db) -> None:
    user = make_user(db, email="idem-db@example.test", account_number="7100000001")
    db.add_all(
        [
            IdempotencyRecord(
                user_id=user.id,
                scope="transfer.create",
                key="same-key",
                request_fingerprint="a" * 64,
            ),
            IdempotencyRecord(
                user_id=user.id,
                scope="transfer.create",
                key="same-key",
                request_fingerprint="a" * 64,
            ),
        ]
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
