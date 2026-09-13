import pytest

from app.enums.payment_channel import PaymentChannel, normalize_payment_channel


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("card", PaymentChannel.CARD),
        ("bank-transfer", PaymentChannel.BANK_TRANSFER),
        ("mobile money", PaymentChannel.MOBILE_MONEY),
        ("cashapp", PaymentChannel.CASH_APP),
        ("cash_app_pay", PaymentChannel.CASH_APP),
        ("apple_pay", PaymentChannel.WALLET),
        ("google pay", PaymentChannel.WALLET),
        ("link", PaymentChannel.WALLET),
        ("venmo", PaymentChannel.VENMO),
    ],
)
def test_payment_channel_normalization(raw: str, expected: PaymentChannel) -> None:
    assert normalize_payment_channel(raw) is expected


def test_payment_channel_unknown_values_are_preserved_as_other() -> None:
    assert normalize_payment_channel("future_wallet_x") is PaymentChannel.OTHER


def test_payment_channel_empty_value_stays_none() -> None:
    assert normalize_payment_channel(None) is None
    assert normalize_payment_channel("") is None
