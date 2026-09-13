import { Outlet } from "react-router-dom";

import ThemeToggle from "@/components/common/ThemeToggle";
import { useBranding } from "@/context/BrandingContext";

export default function PublicLayout() {
  const { config } = useBranding();

  return (
    <main
      className="min-h-screen px-4 py-6 sm:py-12"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.brand_name}
                className="h-10 w-auto max-w-36 object-contain"
              />
            ) : (
              <div
                className="grid size-10 shrink-0 place-items-center text-sm font-semibold"
                style={{
                  background: "var(--brand-primary)",
                  color: "var(--bg)",
                  borderRadius: "var(--radius-control)",
                }}
              >
                {(config?.brand_short_name ?? config?.brand_name ?? "B")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}

            <div
              className="truncate font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {config?.brand_name ?? "Banking"}
            </div>
          </div>

          <ThemeToggle />
        </div>

        <Outlet />

        <footer
          className="mt-8 text-center text-xs leading-5"
          style={{ color: "var(--muted)" }}
        >
          {config?.support_email ? (
            <span>Need help? {config.support_email}</span>
          ) : (
            <span>Secure customer access</span>
          )}
        </footer>
      </div>
    </main>
  );
}
