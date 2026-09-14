from app.middleware.database_cors import (
    normalize_origins,
    split_cors_origins,
)


def test_trycloudflare_wildcard_is_preserved() -> None:
    assert normalize_origins(
        ["*.trycloudflare.com"]
    ) == ["*.trycloudflare.com"]


def test_trycloudflare_wildcard_builds_https_regex() -> None:
    exact, regex = split_cors_origins(
        [
            "http://localhost:5173",
            "*.trycloudflare.com",
        ]
    )

    assert exact == [
        "http://localhost:5173"
    ]
    assert regex is not None

    import re

    pattern = re.compile(regex)
    assert pattern.fullmatch(
        "https://random-name.trycloudflare.com"
    )
    assert not pattern.fullmatch(
        "http://random-name.trycloudflare.com"
    )
    assert not pattern.fullmatch(
        "https://trycloudflare.com"
    )
