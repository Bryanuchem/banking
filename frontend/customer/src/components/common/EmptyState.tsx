import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className="flex min-h-56 flex-col items-center justify-center border px-6 py-10 text-center"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <div
        className="mb-4 grid size-11 place-items-center rounded-full"
        style={{
          background: "var(--surface-alt)",
          color: "var(--muted)",
        }}
      >
        {icon ?? <Inbox size={20} strokeWidth={1.8} />}
      </div>

      <h3 className="font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </h3>

      {description ? (
        <p
          className="mt-1 max-w-sm text-sm leading-6"
          style={{ color: "var(--muted)" }}
        >
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
