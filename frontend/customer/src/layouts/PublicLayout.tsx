import { Outlet, useLocation } from "react-router-dom";

import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import ThemeToggle from "@/components/common/ThemeToggle";
import SupportCards from "@/components/support/SupportCards";
import { useBranding } from "@/context/BrandingContext";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { ROUTES } from "@/routes/paths";

export default function PublicLayout() {
  const { config } = useBranding();
  const { pathname } = useLocation();

  const widerForm =
    pathname === ROUTES.register ||
    pathname === ROUTES.resetPassword;

  return (
    <SnackbarProvider>
    <main
      className="
        relative min-h-screen
        lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]
        xl:grid-cols-[minmax(0,1fr)_minmax(580px,1fr)]
      "
      style={{ background: "var(--bg)" }}
    >
      <div
        className="
          fixed right-4 top-4 z-[70]
          sm:right-6 sm:top-6
          lg:right-6 lg:top-6
          xl:right-8 xl:top-8
        "
      >
        <ThemeToggle />
      </div>

      <AuthBrandPanel />

      <section
        className="
          relative min-h-screen px-4 pb-5 pt-20
          sm:px-6 sm:pb-8 sm:pt-24
          md:px-8 md:pb-10 md:pt-24
          lg:grid lg:place-items-center lg:px-10 lg:py-12
          xl:px-14
        "
      >
        <div
          className="
            pointer-events-none absolute inset-x-0 top-0
            hidden h-72 md:block lg:hidden
          "
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--brand-accent) 7%, var(--surface)) 0%, transparent 100%)",
          }}
        />

        <div
          className={`
            relative z-10 mx-auto w-full
            ${widerForm ? "max-w-xl" : "max-w-md"}
            lg:mx-0
          `}
        >
          <div
            className="
              mb-7 flex items-center gap-3
              sm:mb-8
              lg:hidden
            "
          >
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.brand_name}
                className="
                  h-9 w-auto max-w-36 object-contain
                  sm:h-10 sm:max-w-40
                "
              />
            ) : (
              <div
                className="
                  grid size-9 shrink-0 place-items-center
                  rounded-xl text-sm font-semibold
                  sm:size-10
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

            <div className="min-w-0">
              <div
                className="
                  truncate text-sm font-semibold
                  tracking-tight sm:text-base
                "
                style={{ color: "var(--text)" }}
              >
                {config?.brand_name ?? "Banking"}
              </div>

              <div
                className="hidden text-xs sm:block"
                style={{ color: "var(--muted)" }}
              >
                Customer Portal
              </div>
            </div>
          </div>

          <div
            className="
              mb-8 hidden text-center
              md:block lg:hidden
            "
          >
            <p
              className="
                text-xs font-semibold uppercase
                tracking-[0.16em]
              "
              style={{ color: "var(--brand-accent)" }}
            >
              Secure customer banking
            </p>

            <h1
              className="
                mx-auto mt-3 max-w-xl text-3xl
                font-semibold tracking-[-0.03em]
              "
              style={{ color: "var(--text)" }}
            >
              Your money, clearly managed.
            </h1>

            <p
              className="
                mx-auto mt-3 max-w-xl text-sm
                leading-6
              "
              style={{ color: "var(--muted)" }}
            >
              View balances, move money and manage your
              account from one secure customer portal.
            </p>
          </div>

          <Outlet />

          <div className="mt-6 sm:mt-8">
            <SupportCards compact title="Need help?" />
          </div>

          <footer
            className="mt-5 text-center text-xs leading-5"
            style={{ color: "var(--muted)" }}
          >
            Protected access • Secure sessions
          </footer>
        </div>
      </section>
    </main>
    </SnackbarProvider>
  );
}
