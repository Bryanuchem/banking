from enum import StrEnum


class TransactionType(StrEnum):
    TRANSFER = "transfer"
    WITHDRAWAL = "withdrawal"
    WITHDRAWAL_RELEASE = "withdrawal_release"
    DEPOSIT = "deposit"
    ADJUSTMENT = "adjustment"
    PAYMENT_FEE = "payment_fee"
    ADMIN_CREDIT = "admin_credit"
