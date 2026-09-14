import pytest
from fastapi import HTTPException

from app.constants.setting_key import SettingKeys
from app.services.admin_settings_service import AdminSettingsService


def test_cors_origin_accepts_trycloudflare_suffix_wildcard() -> None:
    assert (
        AdminSettingsService._validate_origin(
            "*.trycloudflare.com"
        )
        == "*.trycloudflare.com"
    )


def test_cors_origin_rejects_wildcard_with_path() -> None:
    with pytest.raises(HTTPException) as exc_info:
        AdminSettingsService._validate_origin(
            "*.trycloudflare.com/api"
        )

    assert exc_info.value.status_code == 422


def test_password_min_length_accepts_safe_range() -> None:
    assert (
        AdminSettingsService._validated_value(
            key=SettingKeys.PASSWORD_MIN_LENGTH,
            value="12",
        )
        == 12
    )


@pytest.mark.parametrize("value", [7, 129, "not-a-number"])
def test_password_min_length_rejects_invalid_values(
    value,
) -> None:
    with pytest.raises(HTTPException):
        AdminSettingsService._validated_value(
            key=SettingKeys.PASSWORD_MIN_LENGTH,
            value=value,
        )
