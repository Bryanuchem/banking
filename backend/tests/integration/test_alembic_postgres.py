from __future__ import annotations

import os
import subprocess
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import make_url


def test_alembic_can_build_schema_from_empty_postgres(pg_engine, test_database_url) -> None:
    """Prove the migration chain, not Base.metadata.create_all(), can build a blank DB."""
    backend_root = Path(__file__).resolve().parents[2]
    alembic_ini = backend_root / "alembic.ini"
    alembic_dir = backend_root / "alembic"
    if not alembic_ini.exists() or not alembic_dir.exists():
        import pytest

        pytest.skip("Repository snapshot does not include alembic.ini/alembic directory.")

    # This database is guarded by conftest: its name must contain 'test'.
    with pg_engine.begin() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))

    url = make_url(test_database_url)
    env = os.environ.copy()
    env.update(
        {
            "DB_HOST": url.host or "localhost",
            "DB_PORT": str(url.port or 5432),
            "DB_NAME": url.database or "banking_test",
            "DB_USER": url.username or "postgres",
            "DB_PASSWORD": url.password or "",
            "APP_SECRET_KEY": env.get("APP_SECRET_KEY", "integration-test-secret"),
        }
    )

    upgraded = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=backend_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    assert upgraded.returncode == 0, upgraded.stdout + "\n" + upgraded.stderr

    checked = subprocess.run(
        ["alembic", "check"],
        cwd=backend_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    assert checked.returncode == 0, checked.stdout + "\n" + checked.stderr
    assert "No new upgrade operations detected" in checked.stdout + checked.stderr
