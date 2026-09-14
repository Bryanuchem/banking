import {
  ArrowLeft,
  Banknote,
  Calendar,
  Landmark,
  Mail,
  Phone,
  ShieldCheck,
  Snowflake,
  UserRound,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { getAdminAccount } from "@/api/admin";
import AccountStateModal from "@/components/accounts/AccountStateModal";
import CreditAccountModal from "@/components/accounts/CreditAccountModal";
import Button from "@/components/common/Button";
import CopyButton from "@/components/common/CopyButton";
import StatusBadge from "@/components/common/StatusBadge";
import { ROUTES } from "@/routes/paths";
import {
  formatCurrency,
  formatDateTime,
  fullName,
} from "@/utils/format";

type Action = "credit" | "active" | "frozen" | "closed" | null;

export default function AdminAccountDetailPage() {
  const { accountId = "" } = useParams();
  const [action, setAction] =
    useState<Action>(null);

  const accountQ = useQuery({
    queryKey: ["admin", "account", accountId],
    queryFn: () => getAdminAccount(accountId),
    enabled: Boolean(accountId),
  });

  if (accountQ.isLoading) {
    return (
      <div
        className="p-8 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Loading account...
      </div>
    );
  }

  if (accountQ.isError || !accountQ.data) {
    return (
      <div className="space-y-4">
        <Link
          to={ROUTES.accounts}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--brand-accent)" }}
        >
          <ArrowLeft size={16} />
          Back to accounts
        </Link>
        <div
          className="rounded-xl border p-6 text-sm"
          style={{
            color: "var(--danger)",
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          Account details could not be loaded.
        </div>
      </div>
    );
  }

  const account = accountQ.data;
  const totalControlled =
    Number(account.available_balance) +
    Number(account.held_balance);

  return (
    <div className="space-y-5">
      <Link
        to={ROUTES.accounts}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--brand-accent)" }}
      >
        <ArrowLeft size={16} />
        Back to accounts
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h1
                className="font-mono text-2xl font-semibold tracking-[-0.03em]"
                style={{ color: "var(--text)" }}
              >
                {account.account_number}
              </h1>
              <CopyButton
                value={account.account_number}
                label="Account number"
                compact
              />
            </div>
            <StatusBadge
              label={account.status}
              tone={
                account.status === "active"
                  ? "success"
                  : account.status === "frozen"
                    ? "warning"
                    : "neutral"
              }
            />
          </div>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Virtual banking account
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {account.status === "active" ? (
            <>
              <Button
                onClick={() => setAction("credit")}
              >
                <Banknote size={16} className="mr-2" />
                Credit account
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAction("frozen")}
              >
                <Snowflake size={16} className="mr-2" />
                Freeze
              </Button>
            </>
          ) : account.status === "frozen" ? (
            <Button
              onClick={() => setAction("active")}
            >
              Reactivate account
            </Button>
          ) : null}

          {account.status !== "closed" ? (
            <Button
              variant="danger"
              onClick={() => setAction("closed")}
            >
              <XCircle size={16} className="mr-2" />
              Close
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [
            "Available balance",
            formatCurrency(
              account.available_balance,
              account.currency,
            ),
          ],
          [
            "Held balance",
            formatCurrency(
              account.held_balance,
              account.currency,
            ),
          ],
          [
            "Controlled funds",
            formatCurrency(
              totalControlled,
              account.currency,
            ),
          ],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-[var(--radius-card)] border p-5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              {label}
            </p>
            <p
              className="mt-2 text-2xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {value}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Landmark
              size={18}
              style={{ color: "var(--brand-accent)" }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Account information
            </h2>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Account number", account.account_number],
              ["Currency", account.currency],
              ["Status", account.status],
              [
                "Created",
                formatDateTime(account.created_at),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {label}
                </dt>
                <dd
                  className="mt-1 text-sm font-medium capitalize"
                  style={{ color: "var(--text)" }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <UserRound
              size={18}
              style={{ color: "var(--brand-accent)" }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Owner
            </h2>
          </div>

          <div className="mt-5 flex items-start gap-3">
            <div
              className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold"
              style={{
                color: "var(--brand-secondary)",
                background: "var(--surface-alt)",
              }}
            >
              {account.owner.first_name[0]}
              {account.owner.last_name[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className="font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {fullName(account.owner)}
                </p>
                {account.owner.is_admin ? (
                  <ShieldCheck
                    size={15}
                    style={{ color: "var(--brand-accent)" }}
                  />
                ) : null}
              </div>
              <div
                className="mt-2 space-y-1.5 text-xs"
                style={{ color: "var(--muted)" }}
              >
                <p className="flex items-center gap-2">
                  <Mail size={13} />
                  {account.owner.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={13} />
                  {account.owner.phone || "No phone"}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={13} />
                  {account.owner.is_active
                    ? "Customer active"
                    : "Customer inactive"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {account.status === "closed" ? (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{
            color: "var(--muted)",
            background: "var(--surface-alt)",
            borderColor: "var(--border)",
          }}
        >
          This account is closed. Pass 2 does not expose reopening a
          closed account.
        </div>
      ) : null}

      <CreditAccountModal
        account={account}
        open={action === "credit"}
        onClose={() => setAction(null)}
      />

      {action === "active" ||
      action === "frozen" ||
      action === "closed" ? (
        <AccountStateModal
          account={account}
          target={action}
          open
          onClose={() => setAction(null)}
        />
      ) : null}
    </div>
  );
}
