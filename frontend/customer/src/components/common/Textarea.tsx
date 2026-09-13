import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full resize-y rounded-[var(--radius-control)] border px-3 py-2.5 text-sm outline-none transition",
          "placeholder:text-[var(--muted)]",
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
      />
    );
  },
);

export default Textarea;
