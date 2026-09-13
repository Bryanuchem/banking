import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export default function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg",
        className,
      )}
      style={{ background: "var(--surface-alt)" }}
      {...props}
    />
  );
}
