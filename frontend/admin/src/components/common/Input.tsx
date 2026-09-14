import type {
  InputHTMLAttributes,
} from "react";

export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-11 w-full rounded-xl border px-3 outline-none transition",
        "focus:ring-2 focus:ring-[color:var(--brand-accent)]/20",
        className,
      ].join(" ")}
      style={{
        color: "var(--text)",
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    />
  );
}
