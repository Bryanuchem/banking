from enum import StrEnum


class WithdrawalStatus(StrEnum):
    AWAITING_FEE = "awaiting_fee"
    FEE_PAID = "fee_paid"
    PENDING_REVIEW = "pending_review"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

    # Kept only for compatibility with any early development rows.
    PENDING = "pending"
