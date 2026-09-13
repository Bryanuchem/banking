from app.enums.account_status import AccountStatus
from app.enums.payment_provider import PaymentProvider
from app.enums.transaction_status import TransactionStatus
from app.enums.withdrawal_status import WithdrawalStatus


def test_account_status_contract() -> None:
    assert {item.value for item in AccountStatus} == {
        "active",
        "frozen",
        "suspended",
        "closed",
    }


def test_payment_provider_contract() -> None:
    assert {item.value for item in PaymentProvider} == {
        "stripe",
        "paypal",
        "paystack",
        "cashapp",
    }


def test_transaction_status_has_reversal_state() -> None:
    assert TransactionStatus.REVERSED.value == "reversed"


def test_withdrawal_terminal_states_do_not_overlap_active_hold_states() -> None:
    terminal = {
        WithdrawalStatus.COMPLETED.value,
        WithdrawalStatus.CANCELLED.value,
        WithdrawalStatus.REJECTED.value,
        WithdrawalStatus.FAILED.value,
    }

    assert terminal.isdisjoint(ReconciliationActiveStatuses.active())


class ReconciliationActiveStatuses:
    @staticmethod
    def active() -> set[str]:
        from app.services.reconciliation_service import ReconciliationService

        return set(ReconciliationService.ACTIVE_HOLD_STATUSES)
