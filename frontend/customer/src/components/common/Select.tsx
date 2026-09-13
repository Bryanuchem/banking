import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "min-h-11 w-full rounded-[var(--radius-control)] border px-3 text-sm outline-none transition",
          "focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-accent)_20%,transparent)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export default Select;
