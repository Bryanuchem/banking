import {
  ArrowRight,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
import { useAuthContext } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { ROUTES } from "@/routes/paths";

export default function LandingPage() {
  const { config } = useBranding();
  const auth = useAuthContext();

  const features = [
    {
      title:
        config?.landing_feature_1_title ??
        "Move money with confidence",
      description:
        config?.landing_feature_1_description ??
        "Send funds with recipient verification, review steps and protected confirmation.",
      icon: WalletCards,
    },
    {
      title:
        config?.landing_feature_2_title ??
        "Deposit and withdraw",
      description:
        config?.landing_feature_2_description ??
        "Use configured payment providers while balances and transaction history stay in sync.",
      icon: Landmark,
    },
    {
      title:
        config?.landing_feature_3_title ??
        "Security that stays visible",
      description:
        config?.landing_feature_3_description ??
        "Two-factor authentication, recovery codes and session controls are built in.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <PublicHeader />

      <main>
        <section className="mx-auto grid max-w-[1200px] gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--brand-accent)" }}
            >
              {config?.landing_eyebrow ??
                "BANKING BUILT AROUND YOU"}
            </p>

            <h1
              className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-7xl"
              style={{ color: "var(--text)" }}
            >
              {config?.landing_title ??
                "Your money, clearly managed."}
            </h1>

            <p
              className="mt-6 max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--muted)" }}
            >
              {config?.landing_description ??
                "Move money, make deposits, manage withdrawals and keep your account security in one calm, secure place."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={
                  auth.isAuthenticated
                    ? ROUTES.dashboard
                    : ROUTES.register
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
                style={{
                  color: "var(--bg)",
                  background: "var(--brand-primary)",
                }}
              >
                {auth.isAuthenticated
                  ? "Open dashboard"
                  : config?.landing_primary_cta_label ??
                    "Create your account"}
                <ArrowRight size={16} />
              </Link>

              {!auth.isAuthenticated ? (
                <Link
                  to={ROUTES.login}
                  className="inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-semibold"
                  style={{
                    color: "var(--text)",
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  {config?.landing_secondary_cta_label ??
                    "Sign in"}
                </Link>
              ) : null}
            </div>
          </div>

          <div
            className="rounded-[28px] border p-6 shadow-sm sm:p-8"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--brand-accent)" }}
            >
              {config?.brand_name ?? "Banking"}
            </p>
            <h2
              className="mt-3 text-2xl font-semibold tracking-[-0.03em]"
              style={{ color: "var(--text)" }}
            >
              One account. The important things close at hand.
            </h2>
            <p
              className="mt-3 text-sm leading-6"
              style={{ color: "var(--muted)" }}
            >
              Balances, transfers, deposits, withdrawals,
              payment activity and account security all live
              in the same customer experience.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["Account", "Clear balances"],
                ["Payments", "Provider-backed"],
                ["Security", "2FA + sessions"],
                ["Activity", "Easy to follow"],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="rounded-2xl p-4"
                  style={{ background: "var(--surface-alt)" }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {title}
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-alt)",
          }}
        >
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--brand-accent)" }}
            >
              BUILT FOR EVERYDAY BANKING
            </p>
            <h2
              className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
              style={{ color: "var(--text)" }}
            >
              Everything important in one place.
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {features.map(
                ({ title, description, icon: Icon }) => (
                  <article
                    key={title}
                    className="rounded-[var(--radius-card)] border p-6"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <span
                      className="grid size-11 place-items-center rounded-xl"
                      style={{
                        color: "var(--brand-accent)",
                        background: "var(--surface-alt)",
                      }}
                    >
                      <Icon size={20} />
                    </span>
                    <h3
                      className="mt-5 font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {title}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: "var(--muted)" }}
                    >
                      {description}
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
