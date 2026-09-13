from __future__ import annotations

from uuid import uuid4

import pytest

import app.services.admin_bootstrap_service as bootstrap_module
from app.models.user import User
from app.services.admin_bootstrap_service import AdminBootstrapService


class FakeDB:
    def __init__(self, scalar_results=None) -> None:
        self.scalar_results = iter(scalar_results or [])
        self.added = []
        self.flushes = 0
        self.commits = 0
        self.refreshed = []

    def scalar(self, statement):
        return next(self.scalar_results, None)

    def add(self, value) -> None:
        self.added.append(value)

    def flush(self) -> None:
        self.flushes += 1

    def commit(self) -> None:
        self.commits += 1

    def refresh(self, value) -> None:
        self.refreshed.append(value)


def make_user(
    *,
    email: str = "user@example.com",
    is_admin: bool = False,
    is_active: bool = True,
) -> User:
    return User(
        id=uuid4(),
        email=email,
        phone=None,
        password_hash="existing-password-hash",
        first_name="Test",
        last_name="User",
        is_active=is_active,
        is_verified=True,
        is_admin=is_admin,
        failed_login_attempts=0,
    )


def test_create_admin_builds_admin_and_account(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db = FakeDB([None])
    account_calls = []

    monkeypatch.setattr(
        bootstrap_module,
        "validate_password_policy",
        lambda db, password: None,
    )
    monkeypatch.setattr(
        bootstrap_module,
        "hash_password",
        lambda password: f"hashed:{password}",
    )
    monkeypatch.setattr(
        bootstrap_module.AccountService,
        "create_for_user",
        staticmethod(
            lambda db, user: account_calls.append((db, user))
        ),
    )

    result = AdminBootstrapService.create(
        db,
        email="  BASE-ADMIN@EXAMPLE.COM  ",
        password="StrongPassword1!",
        first_name="  Base  ",
        last_name="  Admin  ",
    )

    assert result.created is True
    assert result.promoted is False

    user = result.user
    assert user.email == "base-admin@example.com"
    assert user.password_hash == "hashed:StrongPassword1!"
    assert user.first_name == "Base"
    assert user.last_name == "Admin"
    assert user.is_admin is True
    assert user.is_active is True
    assert user.is_verified is True

    assert db.added == [user]
    assert db.flushes == 1
    assert db.commits == 1
    assert db.refreshed == [user]
    assert account_calls == [(db, user)]


def test_create_admin_is_idempotent_for_existing_admin(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    existing = make_user(
        email="same-admin@example.com",
        is_admin=True,
    )
    db = FakeDB([existing])

    def should_not_run(*args, **kwargs):
        raise AssertionError("Creation helpers must not run for an existing admin.")

    monkeypatch.setattr(
        bootstrap_module,
        "validate_password_policy",
        should_not_run,
    )
    monkeypatch.setattr(
        bootstrap_module,
        "hash_password",
        should_not_run,
    )

    result = AdminBootstrapService.create(
        db,
        email="SAME-ADMIN@EXAMPLE.COM",
        password="DifferentPassword1!",
        first_name="Ignored",
        last_name="Ignored",
    )

    assert result.created is False
    assert result.promoted is False
    assert result.user is existing
    assert db.commits == 0
    assert db.added == []


def test_create_admin_refuses_silent_customer_promotion() -> None:
    customer = make_user(
        email="customer@example.com",
        is_admin=False,
    )
    db = FakeDB([customer])

    with pytest.raises(ValueError, match="promote_existing"):
        AdminBootstrapService.create(
            db,
            email=customer.email,
            password="StrongPassword1!",
            first_name="Customer",
            last_name="User",
        )

    assert customer.is_admin is False
    assert db.commits == 0


def test_promote_existing_preserves_identity() -> None:
    customer = make_user(
        email="promote@example.com",
        is_admin=False,
        is_active=False,
    )
    original_id = customer.id
    original_password_hash = customer.password_hash
    db = FakeDB([customer])

    result = AdminBootstrapService.promote_existing(
        db,
        email="  PROMOTE@EXAMPLE.COM ",
    )

    assert result.created is False
    assert result.promoted is True
    assert result.user is customer
    assert result.user.id == original_id
    assert result.user.password_hash == original_password_hash
    assert result.user.is_admin is True
    assert result.user.is_active is True
    assert db.commits == 1
    assert db.refreshed == [customer]


def test_promote_existing_admin_is_idempotent() -> None:
    admin = make_user(
        email="already-admin@example.com",
        is_admin=True,
    )
    db = FakeDB([admin])

    result = AdminBootstrapService.promote_existing(
        db,
        email=admin.email,
    )

    assert result.created is False
    assert result.promoted is False
    assert result.user is admin
    assert db.commits == 0


def test_promote_existing_requires_existing_user() -> None:
    db = FakeDB([None])

    with pytest.raises(
        ValueError,
        match="No user exists with that email address",
    ):
        AdminBootstrapService.promote_existing(
            db,
            email="missing@example.com",
        )

    assert db.commits == 0
