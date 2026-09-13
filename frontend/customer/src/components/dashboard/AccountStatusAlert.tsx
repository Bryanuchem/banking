import {
  CircleAlert,
  LockKeyhole,
  Snowflake,
} from "lucide-react";

type Props = {
  status: string;
};

export default function AccountStatusAlert({ status }: Props) {
  if (status === "active") return null;

  const data =
    status === "frozen"
      ? {
          icon: Snowflake,
          title: "Account frozen",
          description:
            "Some account actions are currently unavailable. Contact support if you need assistance.",
          color: "var(--warning)",
        }
      : status === "suspended"
        ? {
            icon: LockKeyhole,
            title: "Account suspended",
            description:
              "Transfers and withdrawals are unavailable while this account is suspended.",
            color: "var(--danger)",
          }
        : status === "closed"
          ? {
              icon: LockKeyhole,
              title: "Account closed",
              description:
                "This account can no longer make transactions.",
              color: "var(--danger)",
            }
          : {
              icon: CircleAlert,
              title: "Account restricted",
              description:
                "Some account features may currently be unavailable.",
              color: "var(--warning)",
            };

  const Icon = data.icon;

  return (
    <div
      className="
        flex items-start gap-3 rounded-[var(--radius-card)]
        border p-4
      "
      style={{
        color: data.color,
        borderColor: `color-mix(in srgb, ${data.color} 30%, var(--border))`,
        background: `color-mix(in srgb, ${data.color} 8%, var(--surface))`,
      }}
    >
      <Icon className="mt-0.5 shrink-0" size={19} />

      <div>
        <h2 className="text-sm font-semibold">{data.title}</h2>
        <p
          className="mt-1 text-sm leading-6"
          style={{ color: "var(--muted)" }}
        >
          {data.description}
        </p>
      </div>
    </div>
  );
}
