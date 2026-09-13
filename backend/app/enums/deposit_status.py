from enum import StrEnum


class DepositStatus(StrEnum):
    AWAITING_PAYMENT = "awaiting_payment"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
