from fastapi import FastAPI

from app.api.router import api_router
from app.core.settings import settings

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {
        "name": settings.brand_name,
        "api": settings.app_name,
    }
