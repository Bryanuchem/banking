import { formatCurrency } from "@/utils/formatCurrency";

type Props = {
  availableBalance: string;
  heldBalance: string;
  currency: string;
  status: string;
};

export default function AccountOverviewCard({
  availableBalance,
  heldBalance,
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
        Account overview
      </h2>

      <dl className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>
            Available balance
          </dt>
          <dd
            className="text-sm font-semibold tabular-nums"
            style={{ color: "var(--text)" }}
          >
            {formatCurrency(availableBalance, currency)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>
            Held balance
          </dt>
          <dd
            className="text-sm font-semibold tabular-nums"
            style={{ color: "var(--text)" }}
          >
            {formatCurrency(heldBalance, currency)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>
            Account status
          </dt>
          <dd
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            <span
              className="size-2 rounded-full"
              style={{
                background:
                  status === "active"
                    ? "var(--success)"
                    : status === "frozen"
                      ? "var(--warning)"
                      : "var(--danger)",
              }}
            />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
