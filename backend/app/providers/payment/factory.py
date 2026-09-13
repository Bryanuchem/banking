from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.enums.payment_provider import PaymentProvider as PaymentProviderName
from app.providers.payment.base import PaymentProvider
from app.providers.payment.cashapp import CashAppProvider
from app.providers.payment.paypal import PayPalProvider
from app.providers.payment.paystack import PaystackProvider
from app.providers.payment.stripe import StripeProvider


class PaymentProviderFactory:
    PROVIDERS: dict[PaymentProviderName, type[PaymentProvider]] = {
        PaymentProviderName.PAYSTACK: PaystackProvider,
        PaymentProviderName.STRIPE: StripeProvider,
        PaymentProviderName.PAYPAL: PayPalProvider,
        PaymentProviderName.CASHAPP: CashAppProvider,
    }

    @classmethod
    def get_provider(
        cls,
        *,
        provider: PaymentProviderName | str,
        db: Session,
    ) -> PaymentProvider:
        try:
            provider_name = (
                provider
                if isinstance(provider, PaymentProviderName)
                else PaymentProviderName(str(provider).lower())
            )
        except ValueError as exc:
            raise HTTPException(status_code=503, detail="Unsupported payment provider.") from exc

        provider_cls = cls.PROVIDERS.get(provider_name)
        if provider_cls is None:
            raise HTTPException(status_code=503, detail="Unsupported payment provider.")
        return provider_cls(db)
