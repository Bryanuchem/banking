from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.branding import PublicBranding, get_public_branding
from app.database.dependencies import get_db

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/public", response_model=PublicBranding)
def public_config(db: Session = Depends(get_db)) -> PublicBranding:
    return get_public_branding(db)
