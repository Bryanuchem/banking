import { cn } from "@/utils/cn";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type StatusBadgeProps = {
  children: string;
  tone?: StatusTone;
  className?: string;
};

export default function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "danger"
          ? "var(--danger)"
          : tone === "info"
            ? "var(--brand-accent)"
            : "var(--muted)";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-center text-xs font-medium",
        className,
      )}
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
