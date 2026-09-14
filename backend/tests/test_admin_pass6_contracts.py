from app.schemas.admin_security import (
    AdminAdministratorItem,
    AdminAuditLogItemV2,
    AdminReconciliationReport,
    AdminSecurityOverview,
    AdminSessionItem,
)


def test_pass6_security_overview_contract() -> None:
    assert "summary" in AdminSecurityOverview.model_fields
    assert "policy" in AdminSecurityOverview.model_fields


def test_pass6_administrator_contract_has_2fa_and_sessions() -> None:
    assert "two_factor_enabled" in AdminAdministratorItem.model_fields
    assert "active_sessions" in AdminAdministratorItem.model_fields
    assert "has_customer_account" in AdminAdministratorItem.model_fields


def test_pass6_session_contract_has_current_protection() -> None:
    assert "current" in AdminSessionItem.model_fields
    assert "status" in AdminSessionItem.model_fields


def test_pass6_audit_contract_has_details() -> None:
    assert "details" in AdminAuditLogItemV2.model_fields
    assert "actor_email" in AdminAuditLogItemV2.model_fields


def test_pass6_reconciliation_contract_has_accounts() -> None:
    assert "summary" in AdminReconciliationReport.model_fields
    assert "accounts" in AdminReconciliationReport.model_fields
