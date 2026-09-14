import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  children,
  loading = false,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: Props) {
  const style =
    variant === "primary"
      ? {
          color: "#fff",
          background: "var(--brand-primary)",
          borderColor: "var(--brand-primary)",
        }
      : variant === "danger"
        ? {
            color: "var(--danger)",
            background: "var(--surface)",
            borderColor: "var(--danger)",
          }
        : {
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      style={style}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
