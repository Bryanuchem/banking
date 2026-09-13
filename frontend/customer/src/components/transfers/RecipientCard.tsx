import { CheckCircle2 } from "lucide-react";

import type { AccountLookup } from "@/types/transfers";

type Props = { recipient: AccountLookup };

export default function RecipientCard({ recipient }: Props) {
  const initials = recipient.account_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

  return (
    <div
      className="flex items-center gap-3 rounded-[var(--radius-control)] border p-3"
      style={{
        background: "var(--surface-alt)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold"
        style={{
          color: "var(--brand-primary)",
          background:
            "color-mix(in srgb, var(--brand-accent) 14%, var(--surface))",
        }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
            {recipient.account_name}
          </p>
          <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
        </div>
        <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
          Personal account •••• {recipient.account_number.slice(-4)}
        </p>
      </div>
    </div>
  );
}
