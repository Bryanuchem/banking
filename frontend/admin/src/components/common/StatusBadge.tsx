export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
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
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{
        color,
        borderColor:
          `color-mix(in srgb, ${color} 24%, var(--border))`,
        background:
          `color-mix(in srgb, ${color} 8%, var(--surface))`,
      }}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}
