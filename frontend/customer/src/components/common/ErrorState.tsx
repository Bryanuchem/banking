import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import Button from "@/components/common/Button";

export type ErrorStateProps = {
  title?: string;
  description?: string;
  message?: string;
  action?: ReactNode;
  actionLabel?: string;
  retryLabel?: string;
  onAction?: () => void;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  description,
  message,
  action,
  actionLabel,
  retryLabel,
  onAction,
  onRetry,
}: ErrorStateProps) {
  const body = description ?? message;
  const handler = onAction ?? onRetry;
  const label =
    actionLabel ??
    retryLabel ??
    (handler ? "Try again" : undefined);

  return (
    <div
      className="
        rounded-[var(--radius-card)] border
        px-5 py-8 text-center
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
          color: "var(--danger)",
          background:
            "color-mix(in srgb, var(--danger) 10%, var(--surface))",
        }}
      >
        <AlertCircle size={21} />
      </div>

      <h3
        className="mt-4 font-semibold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>

      {body ? (
        <p
          className="
            mx-auto mt-2 max-w-md text-sm leading-6
          "
          style={{ color: "var(--muted)" }}
        >
          {body}
        </p>
      ) : null}

      {action ? (
        <div className="mt-5">{action}</div>
      ) : null}

      {!action && handler && label ? (
        <div className="mt-5">
          <Button onClick={handler}>
            {label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
