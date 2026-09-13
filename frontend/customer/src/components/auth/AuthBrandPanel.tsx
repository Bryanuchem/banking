import {
  ArrowDownToLine,
  BadgeCheck,
  History,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import { useBranding } from "@/context/BrandingContext";
import { ROUTES } from "@/routes/paths";

type PanelCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const defaultCopy: PanelCopy = {
  eyebrow: "Customer banking",
  title: "Your money, clearly managed.",
  description:
    "A calm, secure place to view balances, move money and stay in control of your account.",
};

function getCopy(pathname: string): PanelCopy {
  if (pathname === ROUTES.register) {
    return {
      eyebrow: "Get started",
      title: "Start with confidence.",
      description:
        "Create your account and manage everyday banking from one secure customer portal.",
    };
  }

  if (
    pathname === ROUTES.forgotPassword ||
    pathname === ROUTES.resetPassword
  ) {
    return {
      eyebrow: "Account recovery",
      title: "Secure access, restored simply.",
      description:
        "Recover access with a focused verification flow designed to protect your account.",
    };
  }

  if (pathname === ROUTES.twoFactor) {
    return {
      eyebrow: "Protected access",
      title: "One more step keeps your account safer.",
      description:
        "Two-factor authentication adds another layer of protection before sensitive access is granted.",
    };
  }

  if (pathname === ROUTES.loginLocked) {
    return {
      eyebrow: "Account protection",
      title: "Security comes before speed.",
      description:
        "Temporary access controls help protect your account when unusual sign-in activity is detected.",
    };
  }

  return defaultCopy;
}

const features = [
  {
    icon: ArrowDownToLine,
    label: "View balances clearly",
  },
  {
    icon: Send,
    label: "Move money securely",
  },
  {
    icon: History,
    label: "Track every transaction",
  },
  {
    icon: ShieldCheck,
    label: "Manage account security",
  },
];

export default function AuthBrandPanel() {
  const { pathname } = useLocation();
  const { config } = useBranding();
  const copy = getCopy(pathname);

  return (
    <aside
      className="
        relative hidden min-h-screen overflow-hidden
        lg:flex lg:flex-col lg:justify-between
        lg:px-10 lg:pb-10 lg:pt-24
        xl:px-14 xl:pb-12 xl:pt-28
        2xl:px-16
      "
      style={{
        color: "var(--text)",
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--brand-accent) 16%, var(--surface)) 0%, var(--surface-alt) 46%, var(--surface) 100%)",
        borderRight: "1px solid var(--border)",
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
          pointer-events-none absolute -bottom-36 -left-28
          size-96 rounded-full blur-3xl
        "
        style={{
          background:
            "color-mix(in srgb, var(--brand-secondary) 13%, transparent)",
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
              className="
                grid size-10 place-items-center rounded-xl
                text-sm font-semibold
              "
              style={{
                background: "var(--brand-primary)",
                color: "var(--bg)",
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
            <div
              className="font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {config?.brand_name ?? "Banking"}
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              Customer Portal
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
            color: "var(--brand-accent)",
            borderColor:
              "color-mix(in srgb, var(--brand-accent) 24%, var(--border))",
            background:
              "color-mix(in srgb, var(--brand-accent) 7%, transparent)",
          }}
        >
          <BadgeCheck size={14} />
          {copy.eyebrow}
        </div>

        <h1
          className="
            max-w-[12ch] text-4xl font-semibold
            leading-[1.08] tracking-[-0.035em]
            xl:text-5xl
          "
          style={{ color: "var(--text)" }}
        >
          {copy.title}
        </h1>

        <p
          className="
            mt-5 max-w-lg text-base leading-7
            xl:text-[1.05rem]
          "
          style={{ color: "var(--muted)" }}
        >
          {copy.description}
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
                  color: "var(--brand-accent)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-accent) 20%, var(--border))",
                  background:
                    "color-mix(in srgb, var(--brand-accent) 7%, var(--surface))",
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
              </div>

              <span
                className="text-sm"
                style={{ color: "var(--text)" }}
              >
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
        style={{ color: "var(--muted)" }}
      >
        <div>
          <div
            className="font-medium"
            style={{ color: "var(--text)" }}
          >
            Secure today.
          </div>
          <div>A brighter tomorrow.</div>
        </div>

        <div className="text-right">
          Protected access
          <br />
          Secure sessions
        </div>
      </div>
    </aside>
  );
}
