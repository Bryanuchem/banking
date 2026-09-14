export default function StatusDot({
  label,
  tone = "success",
}: {
  label: string;
  tone?: "success" | "warning" | "danger";
}) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span
        className="size-2 rounded-full"
        style={{ background: color }}
      />
      <span style={{ color }}>{label}</span>
    </span>
  );
}
