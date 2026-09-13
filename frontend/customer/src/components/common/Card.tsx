import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export default function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border p-4 sm:p-5", className)}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
      {...props}
    />
  );
}
