from __future__ import annotations

import pytest

from app.services.rate_limit_service import RateLimitService


@pytest.fixture(autouse=True)
def reset_in_memory_rate_limits() -> None:
    RateLimitService._events.clear()
    yield
    RateLimitService._events.clear()
