import {
  useEffect,
  useId,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  dismissible?: boolean;
}>;

export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  dismissible = true,
  children,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || !dismissible) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, dismissible, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onMouseDown={(event) => {
        if (
          dismissible &&
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="max-h-[92vh] w-full overflow-y-auto border p-5 sm:max-w-lg"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          borderRadius:
            "var(--radius-card) var(--radius-card) 0 0",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold"
              style={{ color: "var(--text)" }}
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--muted)" }}
              >
                {description}
              </p>
            ) : null}
          </div>

          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-lg"
              style={{ color: "var(--muted)" }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <div className="mt-5">{children}</div>

        {footer ? (
          <div
            className="mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"
            style={{ borderColor: "var(--border)" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
