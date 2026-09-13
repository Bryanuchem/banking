import {
  Activity,
  ArrowLeftRight,
  CircleUserRound,
  CreditCard,
  CircleDollarSign,
  HelpCircle,
  Home,
  Landmark,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useBranding } from "@/context/BrandingContext";
import { useSignOut } from "@/hooks/useSignOut";
import { ROUTES } from "@/routes/paths";

const primaryItems = [
  { to: ROUTES.dashboard, label: "Overview", icon: Home, end: true },
  {
    to: ROUTES.transfer,
    label: "Transfer",
    icon: ArrowLeftRight,
  },
  { to: ROUTES.activity, label: "Activity", icon: Activity },
  {
    to: ROUTES.deposit,
    label: "Deposit",
    icon: CircleDollarSign,
  },
  {
    to: ROUTES.withdraw,
    label: "Withdrawals",
    icon: Landmark,
  },
  { to: ROUTES.payments, label: "Payments", icon: CreditCard },
];

const secondaryItems = [
  { to: ROUTES.profile, label: "Profile", icon: CircleUserRound },
];

export default function AppSidebar() {
  const { config } = useBranding();
  const signOut = useSignOut();

  return (
    <aside
      className="
        hidden min-h-screen border-r
        lg:sticky lg:top-0 lg:flex lg:h-screen
        lg:w-[248px] lg:flex-col
      "
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex h-18 items-center gap-3 px-5">
        {config?.logo_url ? (
          <img
            src={config.logo_url}
            alt={config.brand_name}
            className="h-9 w-auto max-w-32 object-contain"
          />
        ) : (
          <div
            className="
              grid size-9 place-items-center rounded-xl
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

        <span
          className="truncate font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {config?.brand_short_name ??
            config?.brand_name ??
            "Banking"}
        </span>
      </div>

      <nav
        className="flex-1 px-3 py-4"
        aria-label="Primary navigation"
      >
        <div className="space-y-1">
          {primaryItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="
                flex min-h-10 items-center gap-3 rounded-xl
                px-3 text-sm font-medium transition
              "
              style={({ isActive }) => ({
                color: isActive
                  ? "var(--text)"
                  : "var(--muted)",
                background: isActive
                  ? "color-mix(in srgb, var(--brand-accent) 10%, var(--surface))"
                  : "transparent",
              })}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </div>

        <div
          className="my-5 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        <div className="space-y-1">
          {secondaryItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="
                flex min-h-10 items-center gap-3 rounded-xl
                px-3 text-sm font-medium transition
              "
              style={({ isActive }) => ({
                color: isActive
                  ? "var(--text)"
                  : "var(--muted)",
                background: isActive
                  ? "var(--surface-alt)"
                  : "transparent",
              })}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}

          <NavLink
            to={ROUTES.security}
            className="
              flex min-h-10 items-center gap-3 rounded-xl
              px-3 text-sm font-medium transition
            "
            style={({ isActive }) => ({
              color: isActive
                ? "var(--text)"
                : "var(--muted)",
              background: isActive
                ? "var(--surface-alt)"
                : "transparent",
            })}
          >
            <ShieldCheck size={17} strokeWidth={1.8} />
            Security
          </NavLink>

          <NavLink
            to={ROUTES.support}
            className="
              flex min-h-10 items-center gap-3 rounded-xl
              px-3 text-sm font-medium transition
            "
            style={({ isActive }) => ({
              color: isActive
                ? "var(--text)"
                : "var(--muted)",
              background: isActive
                ? "var(--surface-alt)"
                : "transparent",
            })}
          >
            <HelpCircle size={17} strokeWidth={1.8} />
            Support
          </NavLink>
        </div>
      </nav>

      <div className="p-3">
        <button
          type="button"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
          className="
            flex min-h-11 w-full items-center gap-3
            rounded-xl px-3 text-sm font-medium
            transition disabled:opacity-50
          "
          style={{ color: "var(--muted)" }}
        >
          <LogOut size={17} strokeWidth={1.8} />
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
