import { formatCurrency } from "@/utils/formatCurrency";
import type { AccountSummary } from "@/types/dashboard";

export default function AccountContextCard({ account }: { account: AccountSummary }) {
  return (
    <aside
      className="rounded-[var(--radius-card)] border p-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="font-semibold" style={{ color: "var(--text)" }}>Your account</h2>
      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-xs" style={{ color: "var(--muted)" }}>Available balance</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "var(--text)" }}>
            {formatCurrency(account.available_balance, account.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <dt className="text-sm" style={{ color: "var(--muted)" }}>Held balance</dt>
          <dd className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {formatCurrency(account.held_balance, account.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>Currency</dt>
          <dd className="text-sm font-medium" style={{ color: "var(--text)" }}>{account.currency}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-sm" style={{ color: "var(--muted)" }}>Account type</dt>
          <dd className="text-sm font-medium" style={{ color: "var(--text)" }}>Personal</dd>
        </div>
      </dl>
    </aside>
  );
}
