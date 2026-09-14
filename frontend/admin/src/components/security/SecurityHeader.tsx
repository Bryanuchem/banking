import SecurityNav from "@/components/security/SecurityNav";

export default function SecurityHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            {description}
          </p>
        </div>
        {action}
      </header>
      <SecurityNav />
    </div>
  );
}
