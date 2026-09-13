import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  StatusBadge,
} from "@/components/common";
import { ROUTES } from "@/routes/paths";
import type { TransactionHistoryItem } from "@/types/dashboard";
import { formatCurrency } from "@/utils/formatCurrency";

type Props = {
  items?: TransactionHistoryItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function transactionLabel(item: TransactionHistoryItem) {
  if (item.description?.trim()) return item.description;

  const labels: Record<string, string> = {
    transfer:
      item.direction === "credit"
        ? "Transfer received"
        : "Transfer sent",
    withdrawal: "Withdrawal",
    withdrawal_release: "Withdrawal release",
    deposit: "Deposit",
    adjustment: "Account adjustment",
    payment_fee: "Payment fee",
    admin_credit: "Account credit",
  };

  return labels[item.type] ?? "Account activity";
}

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "failed") return "danger" as const;
  if (status === "reversed") return "info" as const;
  return "neutral" as const;
}

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const itemDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.round(
    (today.getTime() - itemDay.getTime()) / 86_400_000,
  );

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ActivityIcon({
  direction,
}: {
  direction: string;
}) {
  const credit = direction === "credit";
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;

  return (
    <div
      className="
        grid size-9 shrink-0 place-items-center rounded-xl
      "
      style={{
        color: credit ? "var(--success)" : "var(--danger)",
        background: `color-mix(in srgb, ${
          credit ? "var(--success)" : "var(--danger)"
        } 10%, var(--surface))`,
      }}
    >
      <Icon size={17} strokeWidth={1.9} />
    </div>
  );
}

export default function RecentActivity({
  items,
  isLoading,
  isError,
  onRetry,
}: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Recent activity
        </h2>

        <Link
          to={ROUTES.activity}
          className="text-sm font-medium"
          style={{ color: "var(--brand-accent)" }}
        >
          View all
        </Link>
      </div>

      {isLoading ? <RecentActivitySkeleton /> : null}

      {!isLoading && isError ? (
        <ErrorState
          title="Could not load recent activity"
          description="Your account loaded, but recent transactions are temporarily unavailable."
          actionLabel="Try again"
          onAction={onRetry}
        />
      ) : null}

      {!isLoading && !isError && items?.length === 0 ? (
        <EmptyState
          icon={<CircleDollarSign size={22} />}
          title="No activity yet"
          description="Your transfers, withdrawals and payments will appear here."
          actionLabel="Send money"
          actionHref={ROUTES.transfer}
        />
      ) : null}

      {!isLoading && !isError && items && items.length > 0 ? (
        <div
          className="overflow-hidden rounded-[var(--radius-card)] border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="divide-y sm:hidden" style={{ borderColor: "var(--border)" }}>
            {items.map((item) => {
              const credit = item.direction === "credit";

              return (
                <div
                  key={`${item.id}-${item.direction}`}
                  className="flex items-center gap-3 p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ActivityIcon direction={item.direction} />

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {transactionLabel(item)}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {formatActivityDate(item.created_at)}
                    </p>
                    {item.status !== "completed" ? (
                      <div className="mt-2">
                        <StatusBadge tone={statusTone(item.status)}>
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </StatusBadge>
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="text-right text-sm font-semibold tabular-nums"
                    style={{
                      color: credit
                        ? "var(--success)"
                        : "var(--danger)",
                    }}
                  >
                    {credit ? "+" : "-"}
                    {formatCurrency(item.amount, item.currency)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block">
            <div
              className="
                grid grid-cols-[minmax(0,1.6fr)_minmax(120px,.8fr)_100px_120px]
                gap-4 border-b px-4 py-3
                text-xs font-medium
              "
              style={{
                color: "var(--muted)",
                borderColor: "var(--border)",
                background: "var(--surface-alt)",
              }}
            >
              <span>Description</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {items.map((item) => {
                const credit = item.direction === "credit";

                return (
                  <div
                    key={`${item.id}-${item.direction}`}
                    className="
                      grid grid-cols-[minmax(0,1.6fr)_minmax(120px,.8fr)_100px_120px]
                      items-center gap-4 px-4 py-3
                    "
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <ActivityIcon direction={item.direction} />
                      <span
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {transactionLabel(item)}
                      </span>
                    </div>

                    <span
                      className="text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      {formatActivityDate(item.created_at)}
                    </span>

                    <StatusBadge tone={statusTone(item.status)}>
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </StatusBadge>

                    <span
                      className="
                        text-right text-sm font-semibold
                        tabular-nums
                      "
                      style={{
                        color: credit
                          ? "var(--success)"
                          : "var(--danger)",
                      }}
                    >
                      {credit ? "+" : "-"}
                      {formatCurrency(item.amount, item.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RecentActivitySkeleton() {
  return (
    <div
      className="
        overflow-hidden rounded-[var(--radius-card)] border
        p-4
      "
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="space-y-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3"
          >
            <div
              className="size-9 animate-pulse rounded-xl"
              style={{ background: "var(--surface-alt)" }}
            />
            <div className="flex-1">
              <div
                className="h-3 w-36 animate-pulse rounded"
                style={{ background: "var(--surface-alt)" }}
              />
              <div
                className="mt-2 h-3 w-24 animate-pulse rounded"
                style={{ background: "var(--surface-alt)" }}
              />
            </div>
            <div
              className="h-4 w-20 animate-pulse rounded"
              style={{ background: "var(--surface-alt)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
