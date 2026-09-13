import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--brand-accent)" }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>

        {description ? (
          <p
            className="max-w-2xl text-sm leading-6"
            style={{ color: "var(--muted)" }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
