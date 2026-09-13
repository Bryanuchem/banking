import pytest

import app.utils.security as security_module
from app.utils.security import validate_password_policy


class DummyDB:
    pass


def configure_policy(
    monkeypatch: pytest.MonkeyPatch,
    *,
    minimum: int = 8,
    uppercase: bool = True,
    numbers: bool = True,
    special: bool = True,
) -> None:
    monkeypatch.setattr(
        security_module.SettingService,
        "get_integer",
        staticmethod(lambda db, key, default=0: minimum),
    )

    def get_boolean(db, key, default=False):
        key = str(key)
        if "uppercase" in key:
            return uppercase
        if "numbers" in key:
            return numbers
        if "special" in key:
            return special
        return default

    monkeypatch.setattr(security_module.SettingService, "get_boolean", staticmethod(get_boolean))


def test_password_policy_accepts_compliant_password(monkeypatch: pytest.MonkeyPatch) -> None:
    configure_policy(monkeypatch)
    validate_password_policy(DummyDB(), "Strong#123")


@pytest.mark.parametrize(
    ("password", "message"),
    [
        ("Aa#1", "at least 8"),
        ("lowercase#1", "uppercase"),
        ("NoNumbers#", "number"),
        ("NoSpecial123", "special"),
    ],
)
def test_password_policy_rejects_each_missing_requirement(
    monkeypatch: pytest.MonkeyPatch,
    password: str,
    message: str,
) -> None:
    configure_policy(monkeypatch)

    with pytest.raises(ValueError, match=message):
        validate_password_policy(DummyDB(), password)


def test_password_policy_respects_disabled_optional_rules(monkeypatch: pytest.MonkeyPatch) -> None:
    configure_policy(monkeypatch, uppercase=False, numbers=False, special=False)
    validate_password_policy(DummyDB(), "abcdefgh")
