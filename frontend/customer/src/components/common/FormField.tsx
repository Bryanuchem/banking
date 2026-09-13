import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium"
          style={{ color: "var(--text)" }}
        >
          {label}
        </label>

        {optional ? (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Optional
          </span>
        ) : null}
      </div>

      {children}

      {error ? (
        <p className="text-xs leading-5" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-5" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
