from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi import HTTPException

import app.services.auth_service as auth_module
from app.models.user import User
from app.services.auth_service import AuthService


class FakeDB:
    def __init__(self, user: User | None) -> None:
        self.user = user
        self.commits = 0

    def scalar(self, statement):
        return self.user

    def commit(self) -> None:
        self.commits += 1


def make_user() -> User:
    return User(
        id=uuid4(),
        email="user@example.com",
        password_hash="hash",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True,
        is_admin=False,
        failed_login_attempts=0,
    )


def patch_auth_settings(monkeypatch: pytest.MonkeyPatch, *, max_attempts: int = 3, lock_minutes: int = 10) -> None:
    monkeypatch.setattr(
        auth_module.SettingService,
        "get_integer",
        staticmethod(lambda db, key, default=0: lock_minutes if "lockout" in str(key) else max_attempts),
    )
    monkeypatch.setattr(
        auth_module.SettingService,
        "get_boolean",
        staticmethod(lambda db, key, default=False: False),
    )


def test_failed_password_increments_attempt_counter(monkeypatch: pytest.MonkeyPatch) -> None:
    user = make_user()
    db = FakeDB(user)
    patch_auth_settings(monkeypatch)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: False)

    with pytest.raises(HTTPException) as exc:
        AuthService.authenticate_password(db, email="USER@EXAMPLE.COM", password="wrong")

    assert exc.value.status_code == 401
    assert user.failed_login_attempts == 1
    assert user.locked_until is None
    assert db.commits == 1


def test_reaching_max_failed_attempts_locks_account(monkeypatch: pytest.MonkeyPatch) -> None:
    user = make_user()
    user.failed_login_attempts = 2
    db = FakeDB(user)
    patch_auth_settings(monkeypatch, max_attempts=3, lock_minutes=10)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: False)

    with pytest.raises(HTTPException) as exc:
        AuthService.authenticate_password(db, email=user.email, password="wrong")

    assert exc.value.status_code == 401
    assert user.failed_login_attempts == 3
    assert user.locked_until is not None
    assert user.locked_until > datetime.now(UTC)


def test_locked_account_is_rejected_before_password_check(monkeypatch: pytest.MonkeyPatch) -> None:
    user = make_user()
    user.locked_until = datetime.now(UTC) + timedelta(minutes=5)
    db = FakeDB(user)
    patch_auth_settings(monkeypatch)

    called = False

    def verify_password(*args):
        nonlocal called
        called = True
        return True

    monkeypatch.setattr(auth_module, "verify_password", verify_password)

    with pytest.raises(HTTPException) as exc:
        AuthService.authenticate_password(db, email=user.email, password="correct")

    assert exc.value.status_code == 423
    assert called is False
    assert "Retry-After" in exc.value.headers


def test_expired_lockout_is_cleared_on_successful_login(monkeypatch: pytest.MonkeyPatch) -> None:
    user = make_user()
    user.failed_login_attempts = 4
    user.locked_until = datetime.now(UTC) - timedelta(seconds=1)
    db = FakeDB(user)
    patch_auth_settings(monkeypatch)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: True)

    result = AuthService.authenticate_password(db, email=user.email, password="correct")

    assert result is user
    assert user.failed_login_attempts == 0
    assert user.locked_until is None


def test_disabled_user_cannot_authenticate(monkeypatch: pytest.MonkeyPatch) -> None:
    user = make_user()
    user.is_active = False
    db = FakeDB(user)
    patch_auth_settings(monkeypatch)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: True)

    with pytest.raises(HTTPException) as exc:
        AuthService.authenticate_password(db, email=user.email, password="correct")

    assert exc.value.status_code == 403


def test_record_successful_login_captures_ip_and_time() -> None:
    user = make_user()
    user.failed_login_attempts = 2

    before = datetime.now(UTC)
    AuthService.record_successful_login(user, ip_address="203.0.113.15")
    after = datetime.now(UTC)

    assert user.failed_login_attempts == 0
    assert user.locked_until is None
    assert user.last_login_ip == "203.0.113.15"
    assert before <= user.last_login_at <= after
