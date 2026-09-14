from app.schemas.auth import UserResponse


def test_auth_contract_allows_null_customer_account() -> None:
    assert (
        UserResponse.model_fields[
            "account_number"
        ].annotation
        == (str | None)
    )
    assert (
        UserResponse.model_fields[
            "currency"
        ].annotation
        == (str | None)
    )
