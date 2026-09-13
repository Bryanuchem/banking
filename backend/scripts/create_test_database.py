from __future__ import annotations

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.settings import settings


def main() -> None:
    db_name = os.getenv("TEST_DB_NAME", "banking_test").strip()
    if "test" not in db_name.lower():
        raise SystemExit("Refusing to create a test database whose name does not contain 'test'.")

    admin_url = URL.create(
        drivername="postgresql+psycopg",
        username=os.getenv("TEST_DB_USER", settings.db_user),
        password=os.getenv("TEST_DB_PASSWORD", settings.db_password),
        host=os.getenv("TEST_DB_HOST", settings.db_host),
        port=int(os.getenv("TEST_DB_PORT", str(settings.db_port))),
        database="postgres",
    )
    engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as connection:
        exists = connection.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}
        )
        if exists:
            print(f"Test database {db_name!r} already exists.")
            return
        safe_name = db_name.replace('"', '""')
        connection.execute(text(f'CREATE DATABASE "{safe_name}"'))
        print(f"Created test database {db_name!r}.")
    engine.dispose()


if __name__ == "__main__":
    main()
