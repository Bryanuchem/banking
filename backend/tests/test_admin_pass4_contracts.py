from app.schemas.admin_ops import (
    AdminDashboardSummary,
    AdminWithdrawalCompleteRequest,
    AdminWithdrawalDetail,
)


def test_dashboard_exposes_withdrawal_queue_summary() -> None:
    assert "withdrawals" in AdminDashboardSummary.model_fields


def test_withdrawal_detail_exposes_fee_and_activity() -> None:
    assert {"fee_payment", "activity"}.issubset(
        AdminWithdrawalDetail.model_fields
    )


def test_complete_requires_external_reference() -> None:
    field = AdminWithdrawalCompleteRequest.model_fields[
        "external_reference"
    ]
    assert field.is_required()
