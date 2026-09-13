import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect } from "react";

import type { SnackbarSeverity } from "@/context/SnackbarContext";

type Props = {
  message: string;
  severity?: SnackbarSeverity;
  onClose: () => void;
  duration?: number;
};

const config = {
  success: {
    icon: CheckCircle2,
    background: "var(--success)",
  },
  error: {
    icon: AlertCircle,
    background: "var(--danger)",
  },
  warning: {
    icon: TriangleAlert,
    background: "var(--warning)",
  },
  info: {
    icon: Info,
    background: "var(--brand-accent)",
  },
} satisfies Record<
  SnackbarSeverity,
  {
    icon: typeof Info;
    background: string;
  }
>;

export default function Snackbar({
  message,
  severity = "success",
  onClose,
  duration = 3000,
}: Props) {
  const item = config[severity];
  const Icon = item.icon;

  useEffect(() => {
    const timeout = window.setTimeout(onClose, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, onClose]);

  return (
    <div
      className="
        fixed right-4 z-[100]
        bottom-[calc(5rem+env(safe-area-inset-bottom))]
        w-fit max-w-[calc(100vw-2rem)]
        sm:right-6 sm:max-w-[560px]
        lg:bottom-6
      "
      role={severity === "error" ? "alert" : "status"}
      aria-live={
        severity === "error" ? "assertive" : "polite"
      }
    >
      <div
        className="
          inline-flex max-h-60 max-w-full
          items-start gap-3 overflow-auto
          rounded-xl px-3.5 py-3
          shadow-lg
        "
        style={{
          color: "#fff",
          background: item.background,
        }}
      >
        <Icon
          size={18}
          strokeWidth={2}
          className="mt-0.5 shrink-0"
        />

        <span
          className="
            min-w-0 whitespace-pre-line
            break-words text-sm leading-5
          "
        >
          {message}
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="
            grid size-7 shrink-0 place-items-center
            rounded-lg text-white/85 transition
            hover:bg-white/15 hover:text-white
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-white/75
          "
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
