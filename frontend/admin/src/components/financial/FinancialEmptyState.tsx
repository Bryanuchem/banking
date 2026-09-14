import { FileSearch } from "lucide-react";

export default function FinancialEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-t p-10 text-center" style={{ borderColor: "var(--border)" }}>
      <FileSearch size={30} className="mx-auto" style={{ color: "var(--muted)" }} />
      <p className="mt-3 text-sm font-medium" style={{ color: "var(--text)" }}>{title}</p>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{description}</p>
    </div>
  );
}
