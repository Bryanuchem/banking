import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function SecurityCard({
  title,
  description,
  meta,
  to,
  icon,
}: {
  title: string;
  description: string;
  meta?: string;
  to: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-36 flex-col rounded-[var(--radius-card)] border p-5 transition hover:-translate-y-px"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="grid size-10 place-items-center rounded-xl"
          style={{
            color: "var(--brand-accent)",
            background: "var(--surface-alt)",
          }}
        >
          {icon}
        </div>
        <ArrowRight
          size={17}
          style={{ color: "var(--muted)" }}
        />
      </div>
      <h3
        className="mt-4 font-semibold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>
      <p
        className="mt-1 text-sm leading-5"
        style={{ color: "var(--muted)" }}
      >
        {description}
      </p>
      {meta ? (
        <p
          className="mt-auto pt-3 text-xs font-medium"
          style={{ color: "var(--success)" }}
        >
          {meta}
        </p>
      ) : null}
    </Link>
  );
}
