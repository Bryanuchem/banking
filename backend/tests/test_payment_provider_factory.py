import pytest
from fastapi import HTTPException

from app.enums.payment_provider import PaymentProvider
from app.providers.payment.factory import PaymentProviderFactory


def test_all_supported_provider_names_have_factory_entries() -> None:
    assert set(PaymentProviderFactory.PROVIDERS) == set(PaymentProvider)


def test_factory_accepts_case_insensitive_string(monkeypatch: pytest.MonkeyPatch) -> None:
    class DummyProvider:
        def __init__(self, db) -> None:
            self.db = db

    monkeypatch.setitem(PaymentProviderFactory.PROVIDERS, PaymentProvider.STRIPE, DummyProvider)
    db = object()

    provider = PaymentProviderFactory.get_provider(provider="STRIPE", db=db)

    assert isinstance(provider, DummyProvider)
    assert provider.db is db


def test_factory_rejects_unknown_provider() -> None:
    with pytest.raises(HTTPException) as exc:
        PaymentProviderFactory.get_provider(provider="not-a-gateway", db=object())

    assert exc.value.status_code == 503
    assert exc.value.detail == "Unsupported payment provider."
