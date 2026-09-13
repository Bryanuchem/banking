import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div
      className="
        rounded-[var(--radius-card)] border px-5 py-10
        text-center
      "
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="
          mx-auto grid size-11 place-items-center
          rounded-2xl
        "
        style={{
          color: "var(--brand-accent)",
          background:
            "color-mix(in srgb, var(--brand-accent) 10%, var(--surface))",
        }}
      >
        {icon ?? <Inbox size={21} />}
      </div>

      <h3
        className="mt-4 font-semibold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>

      {description ? (
        <p
          className="
            mx-auto mt-2 max-w-md text-sm leading-6
          "
          style={{ color: "var(--muted)" }}
        >
          {description}
        </p>
      ) : null}

      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link
            to={actionHref}
            className="
              inline-flex min-h-11 items-center justify-center
              rounded-[var(--radius-control)] border px-4
              text-sm font-medium
            "
            style={{
              color: "#fff",
              background: "var(--brand-primary)",
              borderColor: "var(--brand-primary)",
            }}
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}

      {actionLabel && onAction && !actionHref ? (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
