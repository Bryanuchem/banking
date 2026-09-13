import Skeleton from "@/components/common/Skeleton";

type LoadingStateProps = {
  rows?: number;
  compact?: boolean;
  label?: string;
};

export default function LoadingState({
  rows = 3,
  compact = false,
  label = "Loading",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="space-y-3"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="border p-4"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          {!compact ? <Skeleton className="mt-2 h-3 w-2/3" /> : null}
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
