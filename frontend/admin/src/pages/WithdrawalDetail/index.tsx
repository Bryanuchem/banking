import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getAdminWithdrawal,
} from "@/api/admin";
import Button from "@/components/common/Button";
import CopyButton from "@/components/common/CopyButton";
import StatusBadge from "@/components/common/StatusBadge";
import WithdrawalActionModal from "@/components/withdrawals/WithdrawalActionModal";
import { ROUTES } from "@/routes/paths";
import {
  formatCurrency,
  formatDateTime,
} from "@/utils/format";

type Action =
  | "approve"
  | "reject"
  | "complete"
  | "fail"
  | null;

function reviewStatus(status: string) {
  return [
    "pending_review",
    "fee_paid",
    "pending",
  ].includes(status);
}

function statusLabel(status: string) {
  return reviewStatus(status)
    ? "Awaiting review"
    : status.replaceAll("_", " ");
}

function statusTone(status: string) {
  if (status === "completed") return "success";
  if (
    status === "rejected" ||
    status === "failed" ||
    status === "cancelled"
  ) {
    return "danger";
  }
  return "warning";
}

export default function AdminWithdrawalDetailPage() {
  const { withdrawalId = "" } =
    useParams();
  const [action, setAction] =
    useState<Action>(null);

  const query = useQuery({
    queryKey: [
      "admin",
      "withdrawal",
      withdrawalId,
    ],
    queryFn: () =>
      getAdminWithdrawal(withdrawalId),
    enabled: Boolean(withdrawalId),
  });

  if (query.isLoading) {
    return (
      <div
        className="p-8 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Loading withdrawal...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Link
          to={ROUTES.withdrawals}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{
            color: "var(--brand-accent)",
          }}
        >
          <ArrowLeft size={16} />
          Back to withdrawals
        </Link>
        <div
          className="rounded-xl border p-6 text-sm"
          style={{
            color: "var(--danger)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          Withdrawal details could not be loaded.
        </div>
      </div>
    );
  }

  const item = query.data;

  return (
    <div className="space-y-5">
      <Link
        to={ROUTES.withdrawals}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{
          color: "var(--brand-accent)",
        }}
      >
        <ArrowLeft size={16} />
        Back to withdrawals
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className="font-mono text-2xl font-semibold tracking-[-0.03em]"
              style={{ color: "var(--text)" }}
            >
              {item.id.slice(0, 8).toUpperCase()}
            </h1>
            <CopyButton
              value={item.id}
              label="Withdrawal ID"
              compact
            />
            <StatusBadge
              label={statusLabel(item.status)}
              tone={statusTone(item.status)}
            />
          </div>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Withdrawal request
          </p>
        </div>

        <div
          className="text-right text-xs"
          style={{ color: "var(--muted)" }}
        >
          <p>Submitted</p>
          <p className="mt-1 font-medium">
            {formatDateTime(item.created_at)}
          </p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <UserRound
              size={17}
              style={{
                color: "var(--brand-accent)",
              }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Customer
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p style={{ color: "var(--muted)" }}>
                Name
              </p>
              <p
                className="mt-1 font-medium"
                style={{ color: "var(--text)" }}
              >
                {item.customer.name}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--muted)" }}>
                Email
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p
                  className="min-w-0 break-all font-medium"
                  style={{
                    color: "var(--text)",
                  }}
                >
                  {item.customer.email}
                </p>
                <CopyButton
                  value={item.customer.email}
                  label="Email"
                  compact
                />
              </div>
            </div>
            <div>
              <p style={{ color: "var(--muted)" }}>
                Customer account
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p
                  className="font-mono font-medium"
                  style={{
                    color: "var(--text)",
                  }}
                >
                  {item.account.account_number}
                </p>
                <CopyButton
                  value={
                    item.account.account_number
                  }
                  label="Customer account number"
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Banknote
              size={17}
              style={{
                color: "var(--brand-accent)",
              }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Withdrawal
            </h2>
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            {[
              [
                "Amount",
                formatCurrency(
                  item.amount,
                  item.currency,
                ),
              ],
              ["Currency", item.currency],
              [
                "Held amount",
                [
                  "completed",
                  "rejected",
                  "failed",
                  "cancelled",
                ].includes(item.status)
                  ? formatCurrency(
                      "0",
                      item.currency,
                    )
                  : formatCurrency(
                      item.amount,
                      item.currency,
                    ),
              ],
              [
                "Submitted",
                formatDateTime(item.created_at),
              ],
            ].map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-4"
              >
                <dt
                  style={{
                    color: "var(--muted)",
                  }}
                >
                  {key}
                </dt>
                <dd
                  className="text-right font-medium"
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
            <CalendarClock
              size={17}
              style={{
                color: "var(--brand-accent)",
              }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Activity
            </h2>
          </div>

          <div className="mt-5 space-y-0">
            {item.activity.map(
              (entry, index) => (
                <div
                  key={entry.key}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index <
                  item.activity.length - 1 ? (
                    <span
                      className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px"
                      style={{
                        background:
                          "var(--border)",
                      }}
                    />
                  ) : null}

                  <span
                    className="relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-[4px]"
                    style={{
                      background:
                        "var(--brand-accent)",
                      borderColor:
                        "var(--surface)",
                    }}
                  />

                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: "var(--text)",
                      }}
                    >
                      {entry.label}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      {formatDateTime(
                        entry.created_at,
                      )}
                    </p>
                    {entry.actor_email ? (
                      <p
                        className="mt-1 text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        by {entry.actor_email}
                      </p>
                    ) : null}
                    {entry.reason ? (
                      <p
                        className="mt-1 text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {entry.reason}
                      </p>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Building2
              size={17}
              style={{
                color: "var(--brand-accent)",
              }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Destination
            </h2>
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt style={{ color: "var(--muted)" }}>
                Bank
              </dt>
              <dd
                className="font-medium"
                style={{ color: "var(--text)" }}
              >
                {item.destination_bank_name}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: "var(--muted)" }}>
                Account name
              </dt>
              <dd
                className="font-medium"
                style={{ color: "var(--text)" }}
              >
                {item.destination_account_name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt style={{ color: "var(--muted)" }}>
                Account number
              </dt>
              <dd className="flex items-center gap-2">
                <span
                  className="font-mono font-medium"
                  style={{
                    color: "var(--text)",
                  }}
                >
                  {item.destination_account_number}
                </span>
                <CopyButton
                  value={
                    item.destination_account_number
                  }
                  label="Destination account number"
                  compact
                />
              </dd>
            </div>
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
            <CreditCard
              size={17}
              style={{
                color: "var(--brand-accent)",
              }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              Withdrawal fee
            </h2>
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt style={{ color: "var(--muted)" }}>
                Required
              </dt>
              <dd
                className="font-medium"
                style={{ color: "var(--text)" }}
              >
                {formatCurrency(
                  item.fee_amount,
                  item.currency,
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: "var(--muted)" }}>
                Payment status
              </dt>
              <dd>
                <StatusBadge
                  label={
                    item.fee_payment
                      ? "Verified"
                      : "Not verified"
                  }
                  tone={
                    item.fee_payment
                      ? "success"
                      : "danger"
                  }
                />
              </dd>
            </div>

            {item.fee_payment ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Provider
                  </dt>
                  <dd
                    className="font-medium capitalize"
                    style={{
                      color: "var(--text)",
                    }}
                  >
                    {item.fee_payment.provider}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Provider reference
                  </dt>
                  <dd className="flex items-center gap-2">
                    <span
                      className="max-w-52 truncate font-mono text-xs"
                      style={{
                        color: "var(--text)",
                      }}
                    >
                      {item.fee_payment
                        .provider_reference ??
                        item.fee_payment
                          .internal_reference}
                    </span>
                    <CopyButton
                      value={
                        item.fee_payment
                          .provider_reference ??
                        item.fee_payment
                          .internal_reference
                      }
                      label="Payment reference"
                      compact
                    />
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Paid at
                  </dt>
                  <dd
                    className="font-medium"
                    style={{
                      color: "var(--text)",
                    }}
                  >
                    {formatDateTime(
                      item.fee_payment.paid_at ??
                        item.fee_payment.created_at,
                    )}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </section>
      </div>

      {item.external_reference ? (
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={17}
              style={{ color: "var(--success)" }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text)" }}
            >
              External settlement
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className="font-mono text-sm"
              style={{ color: "var(--text)" }}
            >
              {item.external_reference}
            </span>
            <CopyButton
              value={item.external_reference}
              label="External reference"
              compact
            />
          </div>
        </section>
      ) : null}

      {reviewStatus(item.status) ? (
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-semibold"
            style={{ color: "var(--text)" }}
          >
            Review decision
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Approval is available only after the fee is verified.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() =>
                setAction("reject")
              }
            >
              Reject withdrawal
            </Button>
            <Button
              disabled={!item.fee_payment}
              onClick={() =>
                setAction("approve")
              }
            >
              Approve withdrawal
            </Button>
          </div>
        </section>
      ) : null}

      {item.status === "processing" ? (
        <section
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-semibold"
            style={{ color: "var(--text)" }}
          >
            Processing controls
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Complete only after the external transfer succeeds. Mark failed if it cannot be fulfilled.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => setAction("fail")}
            >
              Mark failed
            </Button>
            <Button
              onClick={() =>
                setAction("complete")
              }
            >
              Mark completed
            </Button>
          </div>
        </section>
      ) : null}

      <WithdrawalActionModal
        withdrawal={item}
        action={action}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
