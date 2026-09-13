from fastapi import APIRouter

from app.core.branding import PublicBranding, get_public_branding

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/public", response_model=PublicBranding)
def public_config() -> PublicBranding:
    return get_public_branding()
