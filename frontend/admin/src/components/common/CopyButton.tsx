import {
  Copy,
} from "lucide-react";

import { useSnackbar } from "@/context/SnackbarContext";

export default function CopyButton({
  value,
  label = "Copy",
  compact = false,
}: {
  value: string;
  label?: string;
  compact?: boolean;
}) {
  const snackbar = useSnackbar();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      snackbar.showSnackbar(
        `${label} copied.`,
        "success",
      );
    } catch {
      snackbar.showSnackbar(
        "Clipboard access is unavailable. Copy the value manually.",
        "error",
      );
    }
  }

  return (
    <button
      type="button"
      className={[
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border transition",
        compact
          ? "size-8"
          : "min-h-8 px-2.5 text-xs font-medium",
      ].join(" ")}
      style={{
        color: "var(--muted)",
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
      aria-label={`${label}: ${value}`}
      title={label}
      onClick={handleCopy}
    >
      <Copy size={14} />
      {!compact ? (
        <span>{label}</span>
      ) : null}
    </button>
  );
}
