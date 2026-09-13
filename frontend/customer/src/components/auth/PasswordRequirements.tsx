import { Check, Circle } from "lucide-react";

type Props = {
  password: string;
};

const rules = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "One special character",
    test: (value: string) =>
      /[^A-Za-z0-9]/.test(value),
  },
];

export default function PasswordRequirements({
  password,
}: Props) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-alt)",
      }}
    >
      <p
        className="text-xs font-semibold"
        style={{ color: "var(--text)" }}
      >
        Password requirements
      </p>
      <div className="mt-2 space-y-1.5">
        {rules.map((rule) => {
          const passed = rule.test(password);
          const Icon = passed ? Check : Circle;

          return (
            <div
              key={rule.label}
              className="flex items-center gap-2 text-xs"
              style={{
                color: passed
                  ? "var(--success)"
                  : "var(--muted)",
              }}
            >
              <Icon size={13} />
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
