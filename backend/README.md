# Banking Backend

FastAPI + SQLAlchemy 2.x + PostgreSQL starter.

## Local run

```bash
python -m venv .venv
```

Activate the virtual environment, install dependencies, copy `.env.example` to `.env`, then run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Useful starter endpoints:

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/config/public`

## Database conventions

- PostgreSQL via psycopg 3.
- SQLAlchemy 2.x typed declarative models using `Mapped[...]` and `mapped_column()`.
- One canonical declarative `Base` in `app/database/base.py`.
- Alembic will own schema migrations once initialized.
