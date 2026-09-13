from enum import StrEnum


class PaymentChannel(StrEnum):
    CARD = "card"
    BANK = "bank"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"
    USSD = "ussd"
    QR = "qr"
    WALLET = "wallet"
    PAYPAL = "paypal"
    VENMO = "venmo"
    CASH_APP = "cash_app"
    OTHER = "other"


def normalize_payment_channel(value: str | None) -> PaymentChannel | None:
    if not value:
        return None

    raw = value.strip().lower().replace("-", "_").replace(" ", "_")
    direct = {
        "card": PaymentChannel.CARD,
        "bank": PaymentChannel.BANK,
        "bank_transfer": PaymentChannel.BANK_TRANSFER,
        "banktransfer": PaymentChannel.BANK_TRANSFER,
        "mobile_money": PaymentChannel.MOBILE_MONEY,
        "mobilemoney": PaymentChannel.MOBILE_MONEY,
        "ussd": PaymentChannel.USSD,
        "qr": PaymentChannel.QR,
        "paypal": PaymentChannel.PAYPAL,
        "venmo": PaymentChannel.VENMO,
        "cash_app": PaymentChannel.CASH_APP,
        "cashapp": PaymentChannel.CASH_APP,
        "cash_app_pay": PaymentChannel.CASH_APP,
        "wallet": PaymentChannel.WALLET,
        "link": PaymentChannel.WALLET,
        "apple_pay": PaymentChannel.WALLET,
        "google_pay": PaymentChannel.WALLET,
    }
    return direct.get(raw, PaymentChannel.OTHER)
