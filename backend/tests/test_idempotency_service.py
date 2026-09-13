from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services.idempotency_service import IdempotencyService


def test_fingerprint_is_stable_for_same_payload_regardless_of_key_order() -> None:
    left = {"amount": "25.00", "recipient": "1000000001", "memo": "Lunch"}
    right = {"memo": "Lunch", "recipient": "1000000001", "amount": "25.00"}

    assert IdempotencyService.fingerprint(left) == IdempotencyService.fingerprint(right)


def test_fingerprint_changes_when_request_data_changes() -> None:
    original = {"amount": "25.00", "recipient": "1000000001"}
    changed = {"amount": "26.00", "recipient": "1000000001"}

    assert IdempotencyService.fingerprint(original) != IdempotencyService.fingerprint(changed)


def test_require_key_trims_a_valid_key() -> None:
    assert IdempotencyService.require_key("  request-123  ") == "request-123"


@pytest.mark.parametrize("value", [None, "", "   "])
def test_require_key_rejects_missing_key(value: str | None) -> None:
    with pytest.raises(HTTPException) as exc:
        IdempotencyService.require_key(value)

    assert exc.value.status_code == 400
    assert "Idempotency-Key" in exc.value.detail


def test_require_key_rejects_overlong_key() -> None:
    with pytest.raises(HTTPException) as exc:
        IdempotencyService.require_key("x" * 129)

    assert exc.value.status_code == 400


def test_bind_attaches_resource_identity() -> None:
    class Record:
        resource_type = None
        resource_id = None

    record = Record()
    resource_id = uuid4()

    IdempotencyService.bind(record, resource_type="transfer", resource_id=resource_id)

    assert record.resource_type == "transfer"
    assert record.resource_id == resource_id
