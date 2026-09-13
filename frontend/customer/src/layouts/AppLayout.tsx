import { Outlet } from "react-router-dom";

import ThemeToggle from "@/components/common/ThemeToggle";
import DesktopNav from "@/components/layout/DesktopNav";
import MobileNav from "@/components/layout/MobileNav";
import { useBranding } from "@/context/BrandingContext";

export default function AppLayout() {
  const { config } = useBranding();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          borderColor: "var(--border)",
          background:
            "color-mix(in srgb, var(--surface) 92%, transparent)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt=""
                className="h-8 w-auto max-w-28 object-contain"
              />
            ) : null}

            <div
              className="truncate font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {config?.brand_short_name ??
                config?.brand_name ??
                "Banking"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DesktopNav />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      <MobileNav />
    </div>
  );
}
