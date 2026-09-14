import re
import time
from typing import Any

from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

from app.constants.setting_key import SettingKeys
from app.database.session import SessionLocal
from app.services.setting_service import SettingService


DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "*.trycloudflare.com",
]


def normalize_origins(value: Any) -> list[str]:
    if not isinstance(value, list):
        return DEFAULT_CORS_ORIGINS.copy()

    output: list[str] = []
    seen: set[str] = set()

    for item in value:
        if not isinstance(item, str):
            continue

        origin = item.strip().rstrip("/")
        if not origin or origin in seen:
            continue

        is_full_origin = (
            origin.startswith("http://")
            or origin.startswith("https://")
        )
        is_domain_wildcard = (
            origin.startswith("*.")
            and "/" not in origin[2:]
            and ":" not in origin[2:]
            and "." in origin[2:]
        )

        if not (
            is_full_origin
            or is_domain_wildcard
        ):
            continue

        output.append(origin)
        seen.add(origin)

    return output or DEFAULT_CORS_ORIGINS.copy()


def split_cors_origins(
    origins: list[str],
) -> tuple[list[str], str | None]:
    exact: list[str] = []
    wildcard_patterns: list[str] = []

    for origin in origins:
        if origin.startswith("*."):
            suffix = re.escape(origin[2:])
            wildcard_patterns.append(
                rf"https://[^./]+\.{suffix}(?::\d+)?"
            )
        else:
            exact.append(origin)

    if not wildcard_patterns:
        return exact, None

    return (
        exact,
        "^(?:"
        + "|".join(wildcard_patterns)
        + ")$",
    )


class DatabaseCORSMiddleware:
    """
    CORS policy sourced from DB-backed settings.

    The short cache keeps normal browser traffic from performing a
    settings lookup for every request while still allowing changes to
    take effect without restarting the API.
    """

    def __init__(
        self,
        app: ASGIApp,
        *,
        cache_seconds: float = 5.0,
    ) -> None:
        self.app = app
        self.cache_seconds = cache_seconds
        self._cached_origins = DEFAULT_CORS_ORIGINS.copy()
        self._cached_at = 0.0

    def _origins(self) -> list[str]:
        now = time.monotonic()

        if (
            self._cached_at
            and now - self._cached_at < self.cache_seconds
        ):
            return self._cached_origins

        try:
            with SessionLocal() as db:
                value = SettingService.get(
                    db,
                    SettingKeys.CORS_ALLOWED_ORIGINS,
                    default=DEFAULT_CORS_ORIGINS,
                )
            self._cached_origins = normalize_origins(value)
        except Exception:
            # Bootstrap fallback only. The ordinary request path still
            # reports DB failures normally if the database is down.
            self._cached_origins = DEFAULT_CORS_ORIGINS.copy()

        self._cached_at = now
        return self._cached_origins

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        if b"origin" not in headers:
            await self.app(scope, receive, send)
            return

        exact_origins, origin_regex = (
            split_cors_origins(
                self._origins(),
            )
        )

        cors = CORSMiddleware(
            self.app,
            allow_origins=exact_origins,
            allow_origin_regex=origin_regex,
            allow_credentials=True,
            allow_methods=[
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],
            allow_headers=[
                "Authorization",
                "Content-Type",
                "Idempotency-Key",
                "X-Request-ID",
                "X-2FA-Authorization",
                "X-Step-Up-Authorization",
            ],
        )

        await cors(scope, receive, send)
