from enum import StrEnum


class PaymentStatus(StrEnum):
    PENDING = "pending"
    INITIALIZED = "initialized"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
