
from app.constants.setting_definition import DEFINITIONS_BY_KEY
from app.constants.setting_key import SettingKeys
from app.services.admin_settings_service import PROVIDER_SPECS


def test_paystack_has_public_and_secret_keys() -> None:
    spec = PROVIDER_SPECS["paystack"]

    assert SettingKeys.PAYSTACK_PUBLIC_KEY in spec["fields"]
    assert SettingKeys.PAYSTACK_SECRET_KEY in spec["fields"]
    assert SettingKeys.PAYSTACK_PUBLIC_KEY in spec["required"]
    assert SettingKeys.PAYSTACK_SECRET_KEY in spec["required"]


def test_paystack_public_key_is_not_secret() -> None:
    public_definition = DEFINITIONS_BY_KEY[
        SettingKeys.PAYSTACK_PUBLIC_KEY
    ]
    secret_definition = DEFINITIONS_BY_KEY[
        SettingKeys.PAYSTACK_SECRET_KEY
    ]

    assert public_definition.is_secret is False
    assert secret_definition.is_secret is True
