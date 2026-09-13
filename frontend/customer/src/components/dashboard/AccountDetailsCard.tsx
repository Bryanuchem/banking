import { CopyButton, StatusBadge } from "@/components/common";

type Props = {
  accountNumber: string;
  currency: string;
  status: string;
};

function tone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "frozen") return "warning" as const;
  if (status === "suspended" || status === "closed") {
    return "danger" as const;
  }
  return "neutral" as const;
}

export default function AccountDetailsCard({
  accountNumber,
  currency,
  status,
}: Props) {
  return (
    <section
      className="rounded-[var(--radius-card)] border p-4 sm:p-5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h2
        className="font-semibold tracking-tight"
        style={{ color: "var(--text)" }}
      >
        Account details
      </h2>

      <div className="mt-5">
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Personal account
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span
            className="font-semibold tabular-nums"
            style={{ color: "var(--text)" }}
          >
            {accountNumber}
          </span>
          <CopyButton value={accountNumber} />
        </div>
      </div>

      <dl className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>
            Currency
          </dt>
          <dd className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {currency}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>
            Status
          </dt>
          <dd>
            <StatusBadge tone={tone(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusBadge>
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>
            Account type
          </dt>
          <dd className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Personal
          </dd>
        </div>
      </dl>
    </section>
  );
}
