import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

import ThemeToggle from "@/components/common/ThemeToggle";
import { useBranding } from "@/context/BrandingContext";
import { ROUTES } from "@/routes/paths";
import type { DashboardUser } from "@/types/dashboard";

type Props = {
  user?: DashboardUser;
};

function initials(user?: DashboardUser) {
  const first = user?.first_name?.trim()?.[0] ?? "";
  const last = user?.last_name?.trim()?.[0] ?? "";
  const value = `${first}${last}`.toUpperCase();

  return value || user?.email?.trim()?.[0]?.toUpperCase() || "U";
}

export default function AppHeader({ user }: Props) {
  const { config } = useBranding();

  return (
    <header
      className="
        sticky top-0 z-30 border-b backdrop-blur
      "
      style={{
        borderColor: "var(--border)",
        background:
          "color-mix(in srgb, var(--surface) 92%, transparent)",
      }}
    >
      <div
        className="
          mx-auto flex h-16 max-w-[1280px]
          items-center justify-between gap-4 px-4
          sm:px-6 lg:h-[72px] lg:px-8
        "
      >
        <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.brand_name}
              className="h-8 w-auto max-w-28 object-contain"
            />
          ) : null}

          <span
            className="truncate font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            {config?.brand_short_name ??
              config?.brand_name ??
              "Banking"}
          </span>
        </div>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            aria-label="Notifications, coming soon"
            title="Notifications are planned for a later pass."
            className="
              relative grid size-10 place-items-center
              rounded-xl border
            "
            style={{
              color: "var(--muted)",
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Bell size={18} strokeWidth={1.8} />
          </button>

          <Link
            to={ROUTES.profile}
            className="
              grid size-10 place-items-center rounded-full
              text-xs font-semibold
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--brand-accent)]
            "
            style={{
              color: "var(--text)",
              background:
                "color-mix(in srgb, var(--brand-accent) 16%, var(--surface-alt))",
              border:
                "1px solid color-mix(in srgb, var(--brand-accent) 18%, var(--border))",
            }}
            aria-label="Open profile"
            title={user?.email ?? "Profile"}
          >
            {initials(user)}
          </Link>
        </div>
      </div>
    </header>
  );
}
