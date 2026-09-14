from app.constants.setting_key import SettingKeys
from app.schemas.settings_admin import (
    AdminProviderDetail,
    AdminSettingBatchUpdateRequest,
    AdminTestEmailRequest,
)


def test_pass5_smtp_contract_has_name_and_ssl() -> None:
    assert SettingKeys.SMTP_FROM_NAME == "smtp_from_name"
    assert SettingKeys.SMTP_USE_SSL == "smtp_use_ssl"


def test_pass5_batch_update_contract() -> None:
    payload = AdminSettingBatchUpdateRequest(
        updates=[
            {"key": "brand_name", "value": "Demo Bank"},
        ]
    )
    assert payload.updates[0].key == "brand_name"


def test_pass5_provider_contract_exposes_masked_fields() -> None:
    assert "fields" in AdminProviderDetail.model_fields


def test_pass5_test_email_validates_recipient() -> None:
    payload = AdminTestEmailRequest(
        recipient="admin@example.com"
    )
    assert str(payload.recipient) == "admin@example.com"
