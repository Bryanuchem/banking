# Banking

A white-label virtual banking platform built with React, FastAPI, SQLAlchemy 2.x, and PostgreSQL.

## Current foundation

- Monorepo structure with `backend/` and `frontend/`
- FastAPI application skeleton
- PostgreSQL-ready SQLAlchemy 2.x configuration
- psycopg 3 driver
- One canonical SQLAlchemy declarative base
- Environment-based configuration
- White-label public branding configuration
- API v1 routing
- Health endpoint
- Public deployment-config endpoint
- Python packages initialized with `__init__.py`

## Planned product areas

- Authentication and optional 2FA
- User/customer profiles
- Virtual accounts and account numbers
- Ledger-based balances and transactions
- Internal transfers
- Withdrawals and step-up 2FA
- Real payment-provider integration for explicit service/payment flows
- Admin and audit tooling
- React dashboard
- Docker after the initial product is working locally
