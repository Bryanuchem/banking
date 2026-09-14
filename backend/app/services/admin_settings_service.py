from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_definition import (
    DEFINITIONS_BY_KEY,
    SETTING_DEFINITIONS,
)
from app.constants.setting_key import SettingKeys
from app.models.audit_log import AuditLog
from app.models.setting import Setting
from app.models.user import User
from app.services.setting_service import SettingService


PROVIDER_SPECS: dict[str, dict[str, Any]] = {
    "paystack": {
        "label": "Paystack",
        "fields": [
            SettingKeys.PAYSTACK_PUBLIC_KEY,
            SettingKeys.PAYSTACK_SECRET_KEY,
            SettingKeys.PAYSTACK_CALLBACK_URL,
        ],
        "required": [
            SettingKeys.PAYSTACK_PUBLIC_KEY,
            SettingKeys.PAYSTACK_SECRET_KEY,
        ],
    },
    "stripe": {
        "label": "Stripe",
        "fields": [
            SettingKeys.STRIPE_SECRET_KEY,
            SettingKeys.STRIPE_WEBHOOK_SECRET,
            SettingKeys.STRIPE_SUCCESS_URL,
            SettingKeys.STRIPE_CANCEL_URL,
            SettingKeys.STRIPE_CALLBACK_URL,
        ],
        "required": [SettingKeys.STRIPE_SECRET_KEY],
    },
    "paypal": {
        "label": "PayPal",
        "fields": [
            SettingKeys.PAYPAL_ENVIRONMENT,
            SettingKeys.PAYPAL_CLIENT_ID,
            SettingKeys.PAYPAL_CLIENT_SECRET,
            SettingKeys.PAYPAL_WEBHOOK_ID,
            SettingKeys.PAYPAL_RETURN_URL,
            SettingKeys.PAYPAL_CANCEL_URL,
        ],
        "required": [
            SettingKeys.PAYPAL_CLIENT_ID,
            SettingKeys.PAYPAL_CLIENT_SECRET,
        ],
    },
    "cash-app": {
        "label": "Cash App",
        "fields": [
            SettingKeys.CASHAPP_ENVIRONMENT,
            SettingKeys.CASHAPP_CLIENT_ID,
            SettingKeys.CASHAPP_API_KEY_ID,
            SettingKeys.CASHAPP_API_SECRET,
            SettingKeys.CASHAPP_MERCHANT_ID,
            SettingKeys.CASHAPP_REGION,
            SettingKeys.CASHAPP_REDIRECT_URL,
        ],
        "required": [
            SettingKeys.CASHAPP_CLIENT_ID,
            SettingKeys.CASHAPP_API_KEY_ID,
            SettingKeys.CASHAPP_API_SECRET,
            SettingKeys.CASHAPP_MERCHANT_ID,
        ],
    },
}


class AdminSettingsService:
    @staticmethod
    def _setting_item(
        db: Session,
        definition,
        *,
        row: Setting | None = None,
    ) -> dict[str, Any]:
        # Only secret settings need direct row inspection to determine
        # whether an encrypted value is configured. Non-secret settings
        # should resolve through SettingService so service-level callers
        # do not need a real SQLAlchemy Session merely to receive the
        # normalized result.
        if definition.is_secret:
            if row is None:
                row = db.scalar(
                    select(Setting).where(
                        Setting.key == definition.key
                    )
                )
            value = None
            configured = bool(row and row.value)
        else:
            value = SettingService.get(
                db,
                definition.key,
                default=definition.default,
            )
            configured = value not in (None, "", [], {})

        return {
            "category": definition.category,
            "key": definition.key,
            "value_type": definition.value_type,
            "is_editable": definition.is_editable,
            "is_secret": definition.is_secret,
            "configured": configured,
            "value": value,
            "description": definition.description,
            "formula": definition.formula,
        }

    @classmethod
    def list(cls, db: Session) -> list[dict[str, Any]]:
        rows = {
            row.key: row
            for row in db.scalars(select(Setting)).all()
        }
        return [
            cls._setting_item(
                db,
                definition,
                row=rows.get(definition.key),
            )
            for definition in SETTING_DEFINITIONS
        ]

    @staticmethod
    def _validate_origin(value: str) -> str:
        candidate = value.strip()
        parsed = urlparse(candidate)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.path not in {"", "/"}
            or parsed.params
            or parsed.query
            or parsed.fragment
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "CORS origins must be full http/https origins "
                    "without a path, query or fragment."
                ),
            )
        return f"{parsed.scheme}://{parsed.netloc}"

    @classmethod
    def _validated_value(
        cls,
        *,
        key: str,
        value: Any,
    ) -> Any:
        if key == SettingKeys.WITHDRAWAL_FEE_PERCENT:
            try:
                percentage = Decimal(str(value))
            except (InvalidOperation, ValueError) as exc:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Withdrawal fee percentage must be a "
                        "valid number."
                    ),
                ) from exc
            if percentage <= Decimal("0"):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Withdrawal fee percentage must be "
                        "greater than zero."
                    ),
                )
            if percentage > Decimal("100"):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Withdrawal fee percentage cannot "
                        "exceed 100."
                    ),
                )
            return format(
                percentage.quantize(Decimal("0.01")),
                "f",
            )

        if key == SettingKeys.CORS_ALLOWED_ORIGINS:
            if not isinstance(value, list):
                raise HTTPException(
                    status_code=422,
                    detail="Allowed origins must be a list.",
                )
            clean = []
            for item in value:
                if not isinstance(item, str):
                    raise HTTPException(
                        status_code=422,
                        detail="Every allowed origin must be text.",
                    )
                normalized = cls._validate_origin(item)
                if normalized not in clean:
                    clean.append(normalized)
            if not clean:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "At least one browser origin is required."
                    ),
                )
            return clean

        if key == SettingKeys.SMTP_PORT:
            try:
                port = int(value)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=422,
                    detail="SMTP port must be an integer.",
                ) from exc
            if not 1 <= port <= 65535:
                raise HTTPException(
                    status_code=422,
                    detail="SMTP port must be between 1 and 65535.",
                )
            return port

        if key == SettingKeys.SMTP_USE_SSL and bool(value):
            # UI prevents both, but this guards API callers too.
            return True

        if key.endswith("_url") and value:
            parsed = urlparse(str(value).strip())
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise HTTPException(
                    status_code=422,
                    detail=f"{key} must be a valid http/https URL.",
                )
            return str(value).strip()

        if key.startswith("brand_") and key.endswith("_color"):
            candidate = str(value).strip()
            if not re_hex(candidate):
                raise HTTPException(
                    status_code=422,
                    detail=f"{key} must be a six-digit hex color.",
                )
            return candidate.upper()

        return value

    @staticmethod
    def _audit(
        db: Session,
        *,
        actor: User | None,
        key: str,
        old_value: Any,
        new_value: Any,
        is_secret: bool,
    ) -> None:
        if actor is None:
            return

        details: dict[str, Any] = {
            "setting_key": key,
            "secret": is_secret,
        }
        if is_secret:
            details["changed"] = True
        else:
            details["old_value"] = old_value
            details["new_value"] = new_value

        db.add(
            AuditLog(
                user_id=actor.id,
                action="setting.updated",
                entity_type="setting",
                entity_id=None,
                details=details,
            )
        )
        db.commit()

    @classmethod
    def update(
        cls,
        db: Session,
        *,
        key: str,
        value: Any,
        actor: User | None = None,
    ) -> dict[str, Any]:
        definition = DEFINITIONS_BY_KEY.get(key)
        if definition is None:
            raise HTTPException(
                status_code=404,
                detail="Unknown setting key.",
            )
        if not definition.is_editable:
            raise HTTPException(
                status_code=403,
                detail="This setting is not editable.",
            )

        if definition.is_secret and value in (None, ""):
            # Blank secret updates mean "leave existing secret unchanged".
            return cls._setting_item(db, definition)

        value = cls._validated_value(key=key, value=value)

        if key == SettingKeys.SMTP_USE_TLS and bool(value):
            # Enforce mutually exclusive TLS/SSL saved settings.
            SettingService.set(
                db,
                SettingKeys.SMTP_USE_SSL,
                False,
            )
        elif key == SettingKeys.SMTP_USE_SSL and bool(value):
            SettingService.set(
                db,
                SettingKeys.SMTP_USE_TLS,
                False,
            )

        # The old value is only needed when an authenticated admin
        # mutation will actually be audited. Keeping this lazy preserves
        # service-level callers/tests that only exercise normalization.
        old_value = None
        if actor is not None and not definition.is_secret:
            old_value = SettingService.get(
                db,
                key,
                default=definition.default,
            )

        SettingService.set(db, key, value)
        cls._audit(
            db,
            actor=actor,
            key=key,
            old_value=old_value,
            new_value=None if definition.is_secret else value,
            is_secret=definition.is_secret,
        )
        return cls._setting_item(db, definition)

    @classmethod
    def update_many(
        cls,
        db: Session,
        *,
        updates: list[dict[str, Any]],
        actor: User | None = None,
    ) -> list[dict[str, Any]]:
        return [
            cls.update(
                db,
                key=item["key"],
                value=item["value"],
                actor=actor,
            )
            for item in updates
        ]

    @staticmethod
    def _configured_value(
        db: Session,
        key: str,
    ) -> bool:
        definition = DEFINITIONS_BY_KEY[key]
        if definition.is_secret:
            row = db.scalar(
                select(Setting).where(Setting.key == key)
            )
            return bool(row and row.value)
        value = SettingService.get(
            db,
            key,
            default=definition.default,
        )
        return value not in (None, "", [], {})

    @classmethod
    def provider_summary(
        cls,
        db: Session,
        provider: str,
    ) -> dict[str, Any]:
        spec = PROVIDER_SPECS.get(provider)
        if spec is None:
            raise HTTPException(
                status_code=404,
                detail="Unknown payment provider.",
            )

        required = spec["required"]
        configured_count = sum(
            1
            for key in required
            if cls._configured_value(db, key)
        )

        return {
            "provider": provider,
            "label": spec["label"],
            "configured": configured_count == len(required),
            "configured_fields": configured_count,
            "required_fields": len(required),
        }

    @classmethod
    def list_providers(
        cls,
        db: Session,
    ) -> list[dict[str, Any]]:
        return [
            cls.provider_summary(db, provider)
            for provider in PROVIDER_SPECS
        ]

    @classmethod
    def provider_detail(
        cls,
        db: Session,
        provider: str,
    ) -> dict[str, Any]:
        spec = PROVIDER_SPECS.get(provider)
        if spec is None:
            raise HTTPException(
                status_code=404,
                detail="Unknown payment provider.",
            )

        summary = cls.provider_summary(db, provider)
        fields = [
            cls._setting_item(
                db,
                DEFINITIONS_BY_KEY[key],
            )
            for key in spec["fields"]
        ]
        return {
            **summary,
            "fields": fields,
        }

    @classmethod
    def update_provider(
        cls,
        db: Session,
        *,
        provider: str,
        values: dict[str, Any],
        actor: User | None = None,
    ) -> dict[str, Any]:
        spec = PROVIDER_SPECS.get(provider)
        if spec is None:
            raise HTTPException(
                status_code=404,
                detail="Unknown payment provider.",
            )

        allowed = set(spec["fields"])
        unknown = set(values) - allowed
        if unknown:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Unsupported provider setting(s): "
                    + ", ".join(sorted(unknown))
                ),
            )

        for key, value in values.items():
            cls.update(
                db,
                key=key,
                value=value,
                actor=actor,
            )

        return cls.provider_detail(db, provider)


def re_hex(value: str) -> bool:
    if len(value) != 7 or not value.startswith("#"):
        return False
    try:
        int(value[1:], 16)
    except ValueError:
        return False
    return True
