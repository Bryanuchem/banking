from app.schemas.admin_ops import (
    AdminDepositDetail,
    AdminDashboardSummary,
    AdminPaymentDetail,
    AdminTransactionDetail,
    AdminTransferDetail,
)


def test_dashboard_has_financial_summary() -> None:
    assert "financial" in AdminDashboardSummary.model_fields


def test_financial_detail_contracts_expose_investigation_data() -> None:
    assert "ledger_entries" in AdminTransactionDetail.model_fields
    assert "ledger_entries" in AdminTransferDetail.model_fields
    assert "payment_attempts" in AdminDepositDetail.model_fields
    assert "linked_reference" in AdminPaymentDetail.model_fields


def test_dashboard_financial_summary_has_date_range() -> None:
    financial = AdminDashboardSummary.model_fields["financial"].annotation
    assert {"period_start", "period_end"}.issubset(financial.model_fields)
