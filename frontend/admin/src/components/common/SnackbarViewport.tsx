import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

import {
  useSnackbar,
  type SnackbarTone,
} from "@/context/SnackbarContext";

function toneStyles(tone: SnackbarTone) {
  if (tone === "success") {
    return {
      icon: CheckCircle2,
      color: "var(--success)",
    };
  }

  if (tone === "error") {
    return {
      icon: XCircle,
      color: "var(--danger)",
    };
  }

  if (tone === "warning") {
    return {
      icon: AlertTriangle,
      color: "var(--warning)",
    };
  }

  return {
    icon: Info,
    color: "var(--brand-accent)",
  };
}

export default function SnackbarViewport() {
  const {
    items,
    dismissSnackbar,
  } = useSnackbar();

  return (
    <div
      className="
        pointer-events-none fixed bottom-4 right-4
        z-[140] flex max-w-[calc(100vw-2rem)]
        flex-col items-end gap-2
        sm:bottom-5 sm:right-5
      "
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((item) => {
        const {
          icon: Icon,
          color,
        } = toneStyles(item.tone);

        return (
          <div
            key={item.id}
            className="
              pointer-events-auto inline-flex
              max-w-sm items-center gap-2
              rounded-lg border px-3 py-2
              shadow-lg
            "
            style={{
              color: "var(--text)",
              background: "var(--surface)",
              borderColor:
                `color-mix(in srgb, ${color} 24%, var(--border))`,
            }}
          >
            <Icon
              size={15}
              className="shrink-0"
              style={{ color }}
            />

            <p className="whitespace-nowrap text-sm leading-5">
              {item.message}
            </p>

            <button
              type="button"
              className="grid size-5 shrink-0 place-items-center rounded"
              style={{ color: "var(--muted)" }}
              aria-label="Dismiss notification"
              onClick={() =>
                dismissSnackbar(item.id)
              }
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
