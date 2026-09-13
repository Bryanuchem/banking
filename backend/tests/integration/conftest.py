from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

import pytest
from dotenv import load_dotenv
from sqlalchemy import URL, create_engine, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
import app.models  # noqa: F401 - registers every mapper/table


BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env.test")


def _test_database_url() -> URL | str | None:
    explicit = os.getenv("TEST_DATABASE_URL", "").strip()

    if explicit:
        return explicit

    password = os.getenv("TEST_DB_PASSWORD", "").strip()

    if not password:
        return None

    user = os.getenv("TEST_DB_USER", "postgres").strip()
    host = os.getenv("TEST_DB_HOST", "localhost").strip()
    port = int(os.getenv("TEST_DB_PORT", "5432"))
    name = os.getenv("TEST_DB_NAME", "banking_test").strip()

    return URL.create(
        drivername="postgresql+psycopg",
        username=user,
        password=password,
        host=host,
        port=port,
        database=name,
    )


def _assert_safe_test_database(url: URL | str) -> None:
    parsed_url = make_url(url)
    database = parsed_url.database or ""

    if "test" not in database.lower():
        raise RuntimeError(
            f"Refusing to run integration tests against database {database!r}. "
            "Use a dedicated database whose name contains 'test', "
            "for example 'banking_test'."
        )


@pytest.fixture(scope="session")
def test_database_url() -> URL | str:
    url = _test_database_url()

    if not url:
        pytest.skip(
            "PostgreSQL integration tests require "
            "TEST_DATABASE_URL or TEST_DB_PASSWORD."
        )

    _assert_safe_test_database(url)

    return url


@pytest.fixture(scope="session")
def pg_engine(
    test_database_url: URL | str,
) -> Generator[Engine, None, None]:
    engine = create_engine(
        test_database_url,
        pool_pre_ping=True,
    )

    connected = False

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        connected = True

        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

        yield engine

    finally:
        if connected:
            Base.metadata.drop_all(engine)

        engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(
    pg_engine: Engine,
) -> Generator[None, None, None]:
    table_names = [
        table.name
        for table in reversed(Base.metadata.sorted_tables)
    ]

    if table_names:
        quoted = ", ".join(
            f'"{name}"'
            for name in table_names
        )

        with pg_engine.begin() as connection:
            connection.execute(
                text(
                    f"TRUNCATE TABLE "
                    f"{quoted} "
                    f"RESTART IDENTITY CASCADE"
                )
            )

    yield


@pytest.fixture
def session_factory(pg_engine: Engine):
    return sessionmaker(
        bind=pg_engine,
        autoflush=False,
        expire_on_commit=False,
    )


@pytest.fixture
def db(
    session_factory,
) -> Generator[Session, None, None]:
    session = session_factory()

    try:
        yield session

    finally:
        session.close()