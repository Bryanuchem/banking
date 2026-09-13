import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
