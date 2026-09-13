from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from app.enums.payment_channel import PaymentChannel


@dataclass(slots=True)
class PaymentInitializationResult:
    authorization_url: str | None = None
    access_code: str | None = None
    provider_reference: str | None = None
    provider_status: str | None = None
    provider_response: str | None = None
    channel: PaymentChannel | None = None
    provider_channel: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class PaymentVerificationResult:
    verified: bool = False
    provider_reference: str | None = None
    provider_status: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    paid: bool = False
    failed: bool = False
    channel: PaymentChannel | None = None
    provider_channel: str | None = None
    raw_data: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class PaymentValidationResult:
    valid: bool


@dataclass(slots=True)
class PaymentWebhookResult:
    valid: bool = False
    event: str | None = None
    provider_reference: str | None = None
