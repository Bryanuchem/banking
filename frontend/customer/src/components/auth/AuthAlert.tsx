import { CircleAlert } from "lucide-react";

export default function AuthAlert({
  message,
}: {
  message: string;
}) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border px-3.5 py-3 text-sm leading-5"
      style={{
        color: "var(--danger)",
        borderColor:
          "color-mix(in srgb, var(--danger) 28%, var(--border))",
        background:
          "color-mix(in srgb, var(--danger) 7%, var(--surface))",
      }}
    >
      <CircleAlert
        size={18}
        className="mt-0.5 shrink-0"
        strokeWidth={1.8}
      />
      <span>{message}</span>
    </div>
  );
}
