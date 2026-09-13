import {
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuthContext } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { ROUTES } from "@/routes/paths";

export default function PublicHeader() {
  const { config } = useBranding();
  const auth = useAuthContext();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{
        borderColor: "var(--border)",
        background:
          "color-mix(in srgb, var(--bg) 90%, transparent)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to={ROUTES.landing}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt={config.brand_name}
              className="h-9 w-auto max-w-36 object-contain"
            />
          ) : (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold"
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
            </span>
          )}
          <span
            className="truncate font-semibold"
            style={{ color: "var(--text)" }}
          >
            {config?.brand_short_name ??
              config?.brand_name ??
              "Banking"}
          </span>
        </Link>

        <nav
          className={[
            "items-center gap-1 md:flex",
            open
              ? "absolute inset-x-4 top-[72px] flex flex-col rounded-2xl border p-3 shadow-lg md:static md:flex-row md:border-0 md:p-0 md:shadow-none"
              : "hidden",
          ].join(" ")}
          style={
            open
              ? {
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }
              : undefined
          }
          aria-label="Public navigation"
        >
          <a
            href="#features"
            className="w-full rounded-lg px-3 py-2 text-sm font-medium md:w-auto"
            style={{ color: "var(--muted)" }}
            onClick={() => setOpen(false)}
          >
            Features
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {auth.isAuthenticated ? (
            <Link
              to={ROUTES.dashboard}
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold sm:inline-flex"
              style={{
                color: "var(--bg)",
                background: "var(--brand-primary)",
              }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className="hidden rounded-xl border px-4 py-2 text-sm font-semibold sm:inline-flex"
                style={{
                  color: "var(--text)",
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                }}
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.register}
                className="hidden rounded-xl px-4 py-2 text-sm font-semibold sm:inline-flex"
                style={{
                  color: "var(--bg)",
                  background: "var(--brand-primary)",
                }}
              >
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border md:hidden"
            style={{
              color: "var(--text)",
              borderColor: "var(--border)",
              background: "var(--surface)",
            }}
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
