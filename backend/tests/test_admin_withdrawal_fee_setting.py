from decimal import Decimal

import pytest
from fastapi import HTTPException

import app.services.admin_settings_service as admin_module
from app.constants.setting_key import SettingKeys
from app.services.admin_settings_service import AdminSettingsService


def test_withdrawal_fee_percent_rejects_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with pytest.raises(HTTPException) as exc:
        AdminSettingsService.update(
            object(),
            key=SettingKeys.WITHDRAWAL_FEE_PERCENT,
            value="0",
        )

    assert exc.value.status_code == 422


def test_withdrawal_fee_percent_is_normalized(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    stored = {}

    monkeypatch.setattr(
        admin_module.SettingService,
        "set",
        staticmethod(
            lambda db, key, value: stored.update(
                {"key": key, "value": value}
            )
        ),
    )
    monkeypatch.setattr(
        admin_module.SettingService,
        "get",
        staticmethod(
            lambda db, key, default=None: stored["value"]
        ),
    )

    result = AdminSettingsService.update(
        object(),
        key=SettingKeys.WITHDRAWAL_FEE_PERCENT,
        value="1.5",
    )

    assert stored["value"] == "1.50"
    assert result["value"] == "1.50"
    assert "withdrawal_amount" in result["formula"]


def test_withdrawal_fee_percent_rejects_over_100() -> None:
    with pytest.raises(HTTPException) as exc:
        AdminSettingsService.update(
            object(),
            key=SettingKeys.WITHDRAWAL_FEE_PERCENT,
            value="100.01",
        )

    assert exc.value.status_code == 422
