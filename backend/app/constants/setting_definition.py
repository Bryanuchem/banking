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
    SettingDefinition("branding", SettingKeys.PRIMARY_CURRENCY, "string", "USD"),
    SettingDefinition("branding", SettingKeys.SUPPORT_EMAIL, "string", ""),
    SettingDefinition("branding", SettingKeys.SUPPORT_PHONE, "string", ""),

    SettingDefinition("authentication", SettingKeys.REGISTRATION_ENABLED, "boolean", True),
    SettingDefinition("authentication", SettingKeys.EMAIL_VERIFICATION_REQUIRED, "boolean", False),
    SettingDefinition("authentication", SettingKeys.JWT_EXPIRE_MINUTES, "number", 30),
    SettingDefinition("authentication", SettingKeys.REMEMBER_ME_EXPIRE_DAYS, "number", 30),
    SettingDefinition("authentication", SettingKeys.MAX_LOGIN_ATTEMPTS, "number", 5),
    SettingDefinition("authentication", SettingKeys.LOGIN_LOCKOUT_MINUTES, "number", 15),
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

    SettingDefinition("withdrawals", SettingKeys.WITHDRAWAL_FEE_ENABLED, "boolean", False),
    SettingDefinition("withdrawals", SettingKeys.WITHDRAWAL_FEE_FLAT, "string", "0.00"),
    SettingDefinition("withdrawals", SettingKeys.WITHDRAWAL_FEE_PERCENT, "string", "0.00"),

    SettingDefinition("payments", SettingKeys.PAYMENT_PROVIDER, "string", "stripe"),
    SettingDefinition("payments", SettingKeys.PAYSTACK_SECRET_KEY, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.PAYSTACK_CALLBACK_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.STRIPE_SECRET_KEY, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.STRIPE_WEBHOOK_SECRET, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.STRIPE_SUCCESS_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.STRIPE_CANCEL_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.STRIPE_CALLBACK_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYPAL_ENVIRONMENT, "string", "sandbox"),
    SettingDefinition("payments", SettingKeys.PAYPAL_CLIENT_ID, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYPAL_CLIENT_SECRET, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.PAYPAL_WEBHOOK_ID, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.PAYPAL_RETURN_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.PAYPAL_CANCEL_URL, "string", ""),
    SettingDefinition("payments", SettingKeys.CASHAPP_ENVIRONMENT, "string", "sandbox"),
    SettingDefinition("payments", SettingKeys.CASHAPP_CLIENT_ID, "string", ""),
    SettingDefinition("payments", SettingKeys.CASHAPP_API_KEY_ID, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.CASHAPP_API_SECRET, "string", "", is_secret=True),
    SettingDefinition("payments", SettingKeys.CASHAPP_MERCHANT_ID, "string", ""),
    SettingDefinition("payments", SettingKeys.CASHAPP_REGION, "string", "PDX"),
    SettingDefinition("payments", SettingKeys.CASHAPP_REDIRECT_URL, "string", ""),

    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_ENABLED, "boolean", True),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_REGISTER_PER_MINUTE, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_LOGIN_PER_MINUTE, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_FORGOT_PASSWORD_PER_15_MINUTES, "number", 3),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_OTP_PER_10_MINUTES, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_ACCOUNT_LOOKUP_PER_MINUTE, "number", 30),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_TRANSFER_PER_MINUTE, "number", 10),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_WITHDRAWAL_PER_HOUR, "number", 5),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_PAYMENT_PER_HOUR, "number", 10),
    SettingDefinition("rate_limiting", SettingKeys.RATE_LIMIT_ADMIN_PER_MINUTE, "number", 60),
)

DEFINITIONS_BY_KEY = {item.key: item for item in SETTING_DEFINITIONS}
