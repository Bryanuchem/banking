import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";

type MoneyDisplayProps = {
  value: string | number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  muted?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl sm:text-4xl",
};

export default function MoneyDisplay({
  value,
  currency = "USD",
  size = "md",
  muted = false,
  className,
}: MoneyDisplayProps) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums tracking-tight",
        sizeClasses[size],
        className,
      )}
      style={{ color: muted ? "var(--muted)" : "var(--text)" }}
    >
      {formatCurrency(value, currency)}
    </span>
  );
}
