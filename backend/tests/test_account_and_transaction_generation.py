from uuid import uuid4

import pytest

import app.services.account_service as account_module
import app.services.transaction_service as transaction_module
from app.services.account_service import AccountService
from app.services.transaction_service import TransactionService


class ScalarDB:
    def __init__(self, responses) -> None:
        self.responses = iter(responses)

    def scalar(self, statement):
        return next(self.responses)


def test_account_number_is_ten_digits_and_starts_with_one(monkeypatch: pytest.MonkeyPatch) -> None:
    digits = iter([2, 3, 4, 5, 6, 7, 8, 9, 0])
    monkeypatch.setattr(account_module.secrets, "randbelow", lambda upper: next(digits))

    number = AccountService._generate_account_number(ScalarDB([None]))

    assert number == "1234567890"
    assert len(number) == 10
    assert number.isdigit()


def test_account_number_retries_collision(monkeypatch: pytest.MonkeyPatch) -> None:
    digits = iter([0] * 9 + [1] * 9)
    monkeypatch.setattr(account_module.secrets, "randbelow", lambda upper: next(digits))

    number = AccountService._generate_account_number(ScalarDB([uuid4(), None]))

    assert number == "1111111111"


def test_transaction_reference_retries_collision(monkeypatch: pytest.MonkeyPatch) -> None:
    tokens = iter(["aaaaaa", "bbbbbb"])
    monkeypatch.setattr(transaction_module.secrets, "token_hex", lambda count: next(tokens))

    reference = TransactionService.generate_reference(ScalarDB([uuid4(), None]), prefix="trf")

    assert reference == "TRF-BBBBBB"


def test_transaction_reference_sanitizes_empty_prefix(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(transaction_module.secrets, "token_hex", lambda count: "abcdef")

    reference = TransactionService.generate_reference(ScalarDB([None]), prefix="   ")

    assert reference == "TXN-ABCDEF"
