from fastapi import APIRouter, Depends

from app.api.dependencies import require_internal_service

router = APIRouter(
    prefix="/internal",
    tags=["internal"],
    dependencies=[Depends(require_internal_service)],
)


@router.get("/ping", include_in_schema=False)
def internal_ping() -> dict[str, str]:
    return {"status": "ok", "service": "banking"}
