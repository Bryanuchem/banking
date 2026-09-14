from app.schemas.auth import UserResponse


def test_auth_user_response_exposes_admin_flag() -> None:
    assert "is_admin" in UserResponse.model_fields
    assert (
        UserResponse.model_fields["is_admin"].annotation
        is bool
    )
