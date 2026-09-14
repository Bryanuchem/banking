from app.schemas.admin_ops import (
    AdminAccountDetail,
    AdminDashboardSummary,
    AdminUserDetail,
)


def test_admin_pass2_detail_contracts_exist() -> None:
    assert "account" in AdminUserDetail.model_fields
    assert "owner" in AdminAccountDetail.model_fields


def test_admin_dashboard_summary_contract_exists() -> None:
    assert {"customers", "accounts"}.issubset(
        AdminDashboardSummary.model_fields
    )
