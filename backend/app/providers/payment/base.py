from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Mapping

from app.domain.payment import (
    PaymentInitializationResult,
    PaymentValidationResult,
    PaymentVerificationResult,
    PaymentWebhookResult,
)
from app.models.payment import Payment


class PaymentProvider(ABC):
    """Provider contract used by the banking payment domain.

    Provider implementations own their credentials, redirect URLs, HTTP/SDK
    details, signature validation, and response normalization. The service
    layer only works with these normalized domain results.
    """

    @abstractmethod
    def initialize_payment(
        self,
        *,
        payment: Payment,
        email: str,
        metadata: dict[str, Any],
    ) -> PaymentInitializationResult:
        raise NotImplementedError

    @abstractmethod
    def verify_payment(self, *, reference: str) -> PaymentVerificationResult:
        raise NotImplementedError

    @abstractmethod
    def validate_webhook(
        self,
        *,
        headers: Mapping[str, str],
        body: bytes,
    ) -> PaymentValidationResult:
        raise NotImplementedError

    @abstractmethod
    def parse_webhook(self, *, payload: dict[str, Any]) -> PaymentWebhookResult:
        raise NotImplementedError

    def complete_customer_approval(
        self,
        *,
        payment: Payment,
        approval_data: dict[str, Any],
    ) -> PaymentVerificationResult:
        """Complete providers that require a client-side approval artifact.

        Most providers do not need this step. Cash App Pay uses it to exchange
        a Pay Kit grant for an actual Network API payment.
        """
        from fastapi import HTTPException

        raise HTTPException(
            status_code=409,
            detail="This payment provider does not require a client approval step.",
        )
