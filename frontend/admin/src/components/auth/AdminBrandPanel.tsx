import {
  BadgeCheck,
  ClipboardCheck,
  Landmark,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { useBranding } from "@/context/BrandingContext";

const features = [
  {
    icon: Landmark,
    label: "Review customers and account operations",
  },
  {
    icon: ClipboardCheck,
    label: "Manage money movement and operational queues",
  },
  {
    icon: Settings,
    label: "Control product, provider and branding settings",
  },
  {
    icon: ShieldCheck,
    label: "Protected administrative access and auditability",
  },
];

export default function AdminBrandPanel() {
  const { config } = useBranding();

  return (
    <aside
      className="
        relative hidden min-h-screen overflow-hidden
        lg:flex lg:flex-col lg:justify-between
        lg:px-10 lg:pb-10 lg:pt-12
        xl:px-14 xl:pb-12 xl:pt-14
        2xl:px-16
      "
      style={{
        color: "var(--admin-sidebar-text)",
        background:
          "linear-gradient(145deg, var(--admin-sidebar) 0%, color-mix(in srgb, var(--admin-sidebar-soft) 86%, var(--brand-primary)) 100%)",
        borderRight:
          "1px solid color-mix(in srgb, var(--admin-sidebar-text) 10%, transparent)",
      }}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -right-24 -top-24
          size-80 rounded-full blur-3xl
        "
        style={{
          background:
            "color-mix(in srgb, var(--brand-accent) 20%, transparent)",
        }}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-32 -left-24
          size-96 rounded-full blur-3xl
        "
        style={{
          background:
            "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.brand_name}
              className="h-10 w-auto max-w-44 object-contain"
            />
          ) : (
            <div
              className="grid size-10 place-items-center rounded-xl text-sm font-semibold"
              style={{
                color: "#fff",
                background: "var(--brand-primary)",
              }}
            >
              {(config?.brand_short_name ??
                config?.brand_name ??
                "B")
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )}

          <div>
            <div className="font-semibold tracking-tight">
              {config?.brand_name ?? "Banking"}
            </div>
            <div
              className="text-xs"
              style={{
                color: "var(--admin-sidebar-muted)",
              }}
            >
              Administration Console
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-xl py-10">
        <div
          className="
            mb-5 inline-flex items-center gap-2
            rounded-full border px-3 py-1.5
            text-xs font-medium
          "
          style={{
            color: "#d7fff8",
            borderColor:
              "color-mix(in srgb, var(--brand-accent) 34%, transparent)",
            background:
              "color-mix(in srgb, var(--brand-accent) 12%, transparent)",
          }}
        >
          <BadgeCheck size={14} />
          Authorized operations
        </div>

        <h1 className="max-w-[12ch] text-4xl font-semibold leading-[1.06] tracking-[-0.04em] xl:text-5xl">
          Secure. Manage. Operate.
        </h1>

        <p
          className="mt-5 max-w-lg text-base leading-7 xl:text-[1.05rem]"
          style={{
            color: "var(--admin-sidebar-muted)",
          }}
        >
          A focused workspace for managing customers, accounts,
          transactions, payments, settings and security-sensitive
          banking operations.
        </p>

        <div className="mt-9 grid max-w-lg gap-3">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3"
            >
              <div
                className="
                  grid size-8 shrink-0 place-items-center
                  rounded-lg border
                "
                style={{
                  color: "#d7fff8",
                  borderColor:
                    "color-mix(in srgb, var(--brand-accent) 28%, transparent)",
                  background:
                    "color-mix(in srgb, var(--brand-accent) 10%, transparent)",
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
              </div>

              <span className="text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="
          relative z-10 flex items-end justify-between gap-6
          text-xs
        "
        style={{
          color: "var(--admin-sidebar-muted)",
        }}
      >
        <div>
          <div
            className="font-medium"
            style={{
              color: "var(--admin-sidebar-text)",
            }}
          >
            Administrative access
          </div>
          <div>Authorized personnel only.</div>
        </div>

        <div className="text-right">
          Protected sessions
          <br />
          Auditable operations
        </div>
      </div>
    </aside>
  );
}
