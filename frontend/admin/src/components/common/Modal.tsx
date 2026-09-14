import {
  X,
} from "lucide-react";
import type {
  ReactNode,
} from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${maxWidth} rounded-2xl border shadow-2xl`}
        style={{
          color: "var(--text)",
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <header
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg"
            style={{ color: "var(--muted)" }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}
