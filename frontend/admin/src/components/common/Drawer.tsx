import {
  X,
} from "lucide-react";
import type { ReactNode } from "react";

export default function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside
        className="admin-scrollbar absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l shadow-2xl"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <header
          className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b px-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-semibold"
            style={{ color: "var(--text)" }}
          >
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
      </aside>
    </div>
  );
}
