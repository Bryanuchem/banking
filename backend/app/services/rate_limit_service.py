from __future__ import annotations

from collections import defaultdict, deque
from math import ceil
from threading import Lock
from time import monotonic

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.services.setting_service import SettingService


class RateLimitService:
    """Small in-process sliding-window limiter.

    This is correct for a single FastAPI process and local development. When
    Banking is deployed with multiple workers/instances, the storage backend
    should be moved to Redis while preserving this service contract.
    """

    _events: dict[str, deque[float]] = defaultdict(deque)
    _lock = Lock()

    @classmethod
    def check(
        cls,
        db: Session,
        *,
        bucket: str,
        subject: str,
        setting_key: str,
        default_limit: int,
        window_seconds: int,
    ) -> None:
        if not SettingService.get_boolean(db, SettingKeys.RATE_LIMIT_ENABLED, True):
            return

        limit = SettingService.get_integer(db, setting_key, default_limit)
        if limit <= 0:
            return

        now = monotonic()
        cutoff = now - window_seconds
        storage_key = f"{bucket}:{subject}"

        with cls._lock:
            events = cls._events[storage_key]
            while events and events[0] <= cutoff:
                events.popleft()

            if len(events) >= limit:
                retry_after = max(1, ceil(window_seconds - (now - events[0])))
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            events.append(now)
