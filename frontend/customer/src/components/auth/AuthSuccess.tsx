import type { ReactNode } from "react";
import { Check } from "lucide-react";

export default function AuthSuccess({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-5 text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-full"
        style={{
          color: "var(--success)",
          background:
            "color-mix(in srgb, var(--success) 14%, transparent)",
        }}
      >
        <Check size={28} strokeWidth={2} />
      </div>
      <h2
        className="mt-5 text-xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h2>
      <p
        className="mx-auto mt-2 max-w-sm text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
