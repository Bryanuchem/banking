import pytest
from fastapi import HTTPException

import app.services.rate_limit_service as rate_module
from app.services.rate_limit_service import RateLimitService


class DummyDB:
    pass


def enabled_settings(monkeypatch: pytest.MonkeyPatch, *, limit: int) -> None:
    monkeypatch.setattr(
        rate_module.SettingService,
        "get_boolean",
        staticmethod(lambda db, key, default=True: True),
    )
    monkeypatch.setattr(
        rate_module.SettingService,
        "get_integer",
        staticmethod(lambda db, key, default=0: limit),
    )


def test_rate_limit_allows_requests_up_to_configured_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    enabled_settings(monkeypatch, limit=2)
    times = iter([100.0, 101.0])
    monkeypatch.setattr(rate_module, "monotonic", lambda: next(times))

    RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=2, window_seconds=60)
    RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=2, window_seconds=60)

    assert len(RateLimitService._events["login:ip"]) == 2


def test_rate_limit_rejects_request_after_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    enabled_settings(monkeypatch, limit=2)
    times = iter([100.0, 101.0, 102.0])
    monkeypatch.setattr(rate_module, "monotonic", lambda: next(times))

    for _ in range(2):
        RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=2, window_seconds=60)

    with pytest.raises(HTTPException) as exc:
        RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=2, window_seconds=60)

    assert exc.value.status_code == 429
    assert int(exc.value.headers["Retry-After"]) > 0


def test_rate_limit_drops_expired_events(monkeypatch: pytest.MonkeyPatch) -> None:
    enabled_settings(monkeypatch, limit=1)
    times = iter([100.0, 161.0])
    monkeypatch.setattr(rate_module, "monotonic", lambda: next(times))

    RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=1, window_seconds=60)
    RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=1, window_seconds=60)

    assert list(RateLimitService._events["login:ip"]) == [161.0]


def test_disabled_rate_limiter_does_not_store_events(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        rate_module.SettingService,
        "get_boolean",
        staticmethod(lambda db, key, default=True: False),
    )

    RateLimitService.check(DummyDB(), bucket="login", subject="ip", setting_key="x", default_limit=1, window_seconds=60)

    assert not RateLimitService._events
