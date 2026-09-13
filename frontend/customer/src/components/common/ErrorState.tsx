import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export default function ErrorState({
  title = "Something went wrong",
  description = "We could not load this right now. Please try again.",
  action,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-56 flex-col items-center justify-center border px-6 py-10 text-center"
      style={{
        background: "var(--surface)",
        borderColor: "color-mix(in srgb, var(--danger) 28%, var(--border))",
        borderRadius: "var(--radius-card)",
      }}
    >
      <div
        className="mb-4 grid size-11 place-items-center rounded-full"
        style={{
          background: "color-mix(in srgb, var(--danger) 10%, transparent)",
          color: "var(--danger)",
        }}
      >
        <CircleAlert size={20} strokeWidth={1.8} />
      </div>

      <h3 className="font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </h3>

      <p
        className="mt-1 max-w-sm text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        {description}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
