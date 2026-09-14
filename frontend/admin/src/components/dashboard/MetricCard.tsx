import type { LucideIcon } from "lucide-react";

export default function MetricCard({
  label,
  note,
  icon: Icon,
}: {
  label: string;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <article
      className="rounded-[var(--radius-card)] border p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            {label}
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            —
          </p>
        </div>

        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{
            color: "var(--brand-accent)",
            background: "var(--surface-alt)",
          }}
        >
          <Icon size={17} />
        </span>
      </div>

      <p
        className="mt-3 text-xs"
        style={{ color: "var(--muted)" }}
      >
        {note}
      </p>
    </article>
  );
}
