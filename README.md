# Real account deletion

This overlay adds permanent customer-facing account deletion while preserving
financial history.

## Semantics

"Delete account" is intentionally a **soft deletion** of the banking account:

```text
accounts row remains
account.id remains
account_number remains
ledger_entries remain
transactions remain
transfers remain
withdrawals remain
deposits remain
payments remain

account.status = closed
account.deleted_at = timestamp
account.deletion_reason = optional reason
```

That is the only safe interpretation of deletion for an auditable banking
ledger.

For a normal customer:

```text
User.is_active = false
all active sessions are revoked
```

For a dual-role administrator/customer:

```text
customer banking account is deleted
administrator identity remains active
```

## Hard deletion rules

Deletion is refused unless:

```text
available_balance == 0
held_balance == 0
pending withdrawals == 0
pending deposits == 0
```

This prevents a deposit webhook or an in-flight withdrawal from changing a
deleted account later.

## Customer API

```text
GET    /api/v1/account/deletion-status
DELETE /api/v1/account
```

The DELETE request requires the account number as confirmation.

If the customer has 2FA enabled, deletion uses the existing step-up system:

```text
scope = account:delete
X-Step-Up-Authorization
```

## Customer UI

Profile now ends with:

```text
Sign out
Delete banking account
```

Delete opens a confirmation dialog.

If money remains:

```text
Clear the account first
[ Withdraw / clear balance ]
```

which routes to `/withdraw`.

Held funds or pending withdrawals/deposits also block deletion until resolved.

## Admin API

```text
DELETE /api/v1/admin/users/{user_id}/account
```

Admin cannot bypass the zero-balance rule.

The customer detail drawer now ends with:

```text
Delete banking account
```

If balance is not zero, the action is blocked and the admin is directed to the
account detail screen.

## Migration

Run:

```bash
cd backend
alembic upgrade head
```

New account fields:

```text
deleted_at
deletion_reason
```

## Test correction included

The previous role-separation overlay accidentally replaced the working fake-DB
admin bootstrap tests with tests requiring `db` and `user_factory` fixtures.

This overlay restores the fake-unit-test approach, so those tests no longer
depend on unavailable fixtures.

## Verify

```bash
cd backend
alembic upgrade head
pytest
```

Then:

```bash
cd frontend/customer
npm run build
```

and:

```bash
cd frontend/admin
npm run build
```
