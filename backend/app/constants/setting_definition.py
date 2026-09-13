from dataclasses import dataclass
from typing import Any

from app.constants.setting_key import SettingKeys


@dataclass(frozen=True)
class SettingDefinition:
    category: str
    key: str
    value_type: str
    default: Any
    is_editable: bool = True
    is_secret: bool = False


SETTING_DEFINITIONS = (
    SettingDefinition("branding", SettingKeys.BRAND_NAME, "string", "Banking"),
    SettingDefinition("branding", SettingKeys.BRAND_SHORT_NAME, "string", "Banking"),
    SettingDefinition("branding", SettingKeys.LOGO_URL, "string", ""),
    SettingDefinition("branding", SettingKeys.FAVICON_URL, "string", ""),
    SettingDefinition("branding", SettingKeys.PRIMARY_CURRENCY, "string", "NGN"),
    SettingDefinition("branding", SettingKeys.SUPPORT_EMAIL, "string", ""),
    SettingDefinition("branding", SettingKeys.SUPPORT_PHONE, "string", ""),

    SettingDefinition("authentication", SettingKeys.REGISTRATION_ENABLED, "boolean", True),
    SettingDefinition("authentication", SettingKeys.EMAIL_VERIFICATION_REQUIRED, "boolean", False),
    SettingDefinition("authentication", SettingKeys.JWT_EXPIRE_MINUTES, "number", 30),
    SettingDefinition("authentication", SettingKeys.REMEMBER_ME_EXPIRE_DAYS, "number", 30),
    SettingDefinition("authentication", SettingKeys.MAX_LOGIN_ATTEMPTS, "number", 5),
    SettingDefinition("authentication", SettingKeys.PASSWORD_MIN_LENGTH, "number", 8),
    SettingDefinition("authentication", SettingKeys.REQUIRE_SPECIAL_CHARACTERS, "boolean", True),
    SettingDefinition("authentication", SettingKeys.REQUIRE_UPPERCASE, "boolean", True),
    SettingDefinition("authentication", SettingKeys.REQUIRE_NUMBERS, "boolean", True),

    SettingDefinition("two_factor", SettingKeys.TWO_FACTOR_AUTH_POLICY, "string", "optional"),
    SettingDefinition("two_factor", SettingKeys.TWO_FACTOR_ISSUER, "string", "Banking"),
    SettingDefinition("two_factor", SettingKeys.TWO_FACTOR_RECOVERY_CODE_COUNT, "number", 10),

    SettingDefinition("otp", SettingKeys.OTP_EXPIRY_MINUTES, "number", 10),
    SettingDefinition("otp", SettingKeys.OTP_LENGTH, "number", 6),

    SettingDefinition("smtp", SettingKeys.SMTP_ENABLED, "boolean", False),
    SettingDefinition("smtp", SettingKeys.SMTP_HOST, "string", ""),
    SettingDefinition("smtp", SettingKeys.SMTP_PORT, "number", 587),
    SettingDefinition("smtp", SettingKeys.SMTP_USERNAME, "string", ""),
    SettingDefinition("smtp", SettingKeys.SMTP_PASSWORD, "string", "", is_secret=True),
    SettingDefinition("smtp", SettingKeys.SMTP_FROM_EMAIL, "string", ""),
    SettingDefinition("smtp", SettingKeys.SMTP_USE_TLS, "boolean", True),
)

DEFINITIONS_BY_KEY = {item.key: item for item in SETTING_DEFINITIONS}
