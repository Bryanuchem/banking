import logging

from fastapi import FastAPI
from app.api.router import api_router
from app.core.settings import settings
from app.middleware.database_cors import DatabaseCORSMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security import SecurityHeadersMiddleware

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(DatabaseCORSMiddleware)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"name": "Banking", "api": settings.app_name}
