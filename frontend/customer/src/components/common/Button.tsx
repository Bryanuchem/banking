import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  icon,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const style =
    variant === "primary"
      ? {
          background: "var(--brand-primary)",
          color: "var(--on-brand-primary)",
          borderColor: "var(--brand-primary)",
        }
      : variant === "danger"
        ? {
            background: "var(--danger)",
            color: "#fff",
            borderColor: "var(--danger)",
          }
        : variant === "secondary"
          ? {
              background: "var(--surface)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }
          : {
              background: "transparent",
              color: "var(--text)",
              borderColor: "transparent",
            };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        className,
      )}
      style={style}
      {...props}
    >
      {loading ? (
        <LoaderCircle
          size={17}
          className="animate-spin"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      <span>{loading ? loadingText ?? children : children}</span>
    </button>
  );
}
