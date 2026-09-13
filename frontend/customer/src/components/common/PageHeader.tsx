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
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <p
            className="
              text-[11px] font-semibold uppercase tracking-[0.16em]
              sm:text-xs
            "
            style={{ color: "var(--brand-accent)" }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className="
            text-[1.45rem] font-semibold tracking-tight
            sm:text-[1.65rem]
            lg:text-[1.75rem]
          "
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>

        {description ? (
          <p
            className="
              max-w-2xl text-sm leading-6
              sm:text-[0.95rem]
            "
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
