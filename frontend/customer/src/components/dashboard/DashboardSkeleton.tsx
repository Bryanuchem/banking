function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: "var(--surface-alt)" }}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Block className="h-7 w-52" />
        <Block className="mt-2 h-4 w-64" />
      </div>

      <div
        className="
          rounded-[var(--radius-card)] border p-5
          sm:p-6 lg:p-7
        "
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <Block className="h-4 w-32" />
        <Block className="mt-4 h-10 w-56" />
        <Block className="mt-5 h-4 w-40" />
        <Block className="mt-5 h-7 w-28" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Block key={item} className="h-16 sm:h-12" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <Block className="h-5 w-32" />
          <Block className="mt-5 h-4 w-44" />
          <Block className="mt-5 h-4 w-full" />
          <Block className="mt-3 h-4 w-full" />
        </div>

        <div
          className="rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <Block className="h-5 w-36" />
          <Block className="mt-5 h-4 w-full" />
          <Block className="mt-3 h-4 w-full" />
          <Block className="mt-3 h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
