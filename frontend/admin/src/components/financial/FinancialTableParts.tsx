import { Search } from "lucide-react";
import type { ReactNode } from "react";

import CopyButton from "@/components/common/CopyButton";
import StatusBadge from "@/components/common/StatusBadge";
import type { AdminLedgerEntry } from "@/types/admin";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
      <input
        value={value}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
        style={{ color: "var(--text)", background: "var(--surface)", borderColor: "var(--border)" }}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, children, ariaLabel }: { value: string; onChange: (value: string) => void; children: ReactNode; ariaLabel: string }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      className="h-11 rounded-xl border px-3 text-sm outline-none"
      style={{ color: "var(--text)", background: "var(--surface)", borderColor: "var(--border)" }}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}

export function RefValue({ value, label = "Reference" }: { value: string | null | undefined; label?: string }) {
  if (!value) return <span style={{ color: "var(--muted)" }}>—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-xs" style={{ color: "var(--text)" }}>{value}</span>
      <CopyButton value={value} label={label} compact />
    </span>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
      <div className="min-w-0 text-right text-sm font-medium" style={{ color: "var(--text)" }}>{children}</div>
    </div>
  );
}

export function LedgerTable({ entries }: { entries: AdminLedgerEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm" style={{ color: "var(--muted)" }}>No ledger entries are linked to this record.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead style={{ background: "var(--surface-alt)" }}>
          <tr>
            {['Type', 'Account', 'Amount', 'Balance after', 'Date'].map((label) => (
              <th key={label} className="px-3 py-2.5 font-semibold" style={{ color: "var(--muted)" }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t" style={{ borderColor: "var(--border)" }}>
              <td className="px-3 py-2.5"><StatusBadge label={entry.entry_type} tone={entry.entry_type.toLowerCase() === 'credit' ? 'success' : 'warning'} /></td>
              <td className="px-3 py-2.5">
                <div className="font-mono" style={{ color: "var(--text)" }}>{entry.account.account_number}</div>
                <div className="mt-0.5" style={{ color: "var(--muted)" }}>{entry.customer.name}</div>
              </td>
              <td className="px-3 py-2.5 font-semibold" style={{ color: entry.entry_type.toLowerCase() === 'credit' ? 'var(--success)' : 'var(--warning)' }}>
                {formatCurrency(entry.amount, entry.account.currency)}
              </td>
              <td className="px-3 py-2.5" style={{ color: "var(--text)" }}>{formatCurrency(entry.balance_after, entry.account.currency)}</td>
              <td className="px-3 py-2.5" style={{ color: "var(--muted)" }}>{formatDateTime(entry.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
