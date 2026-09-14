import {
  ArrowLeftRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gauge,
  Landmark,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAdminAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { useAdminLayout } from "@/context/LayoutContext";
import { ROUTES } from "@/routes/paths";

const items = [
  {
    label: "Overview",
    to: ROUTES.dashboard,
    icon: Gauge,
    end: true,
  },
  {
    label: "Customers",
    to: ROUTES.customers,
    icon: Users,
  },
  {
    label: "Accounts",
    to: ROUTES.accounts,
    icon: Landmark,
  },
  {
    label: "Transactions",
    to: ROUTES.transactions,
    icon: WalletCards,
  },
  {
    label: "Transfers",
    to: ROUTES.transfers,
    icon: ArrowLeftRight,
  },
  {
    label: "Deposits",
    to: ROUTES.deposits,
    icon: BanknoteArrowDown,
  },
  {
    label: "Withdrawals",
    to: ROUTES.withdrawals,
    icon: BanknoteArrowUp,
  },
  {
    label: "Payments",
    to: ROUTES.payments,
    icon: CreditCard,
  },
  {
    label: "Operations",
    to: ROUTES.operationsJobs,
    icon: Workflow,
  },
  {
    label: "Settings",
    to: ROUTES.settings,
    icon: Settings,
  },
  {
    label: "Security",
    to: ROUTES.security,
    icon: ShieldCheck,
  },
];

export default function AdminSidebar() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileOpen,
    setMobileOpen,
  } = useAdminLayout();
  const { user, signOut } = useAdminAuth();
  const { config } = useBranding();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    setMobileOpen(false);
    navigate(ROUTES.login, {
      replace: true,
    });
  }

  const name =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(" ") || "Administrator";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label="Close admin navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-[width,transform] duration-200",
          sidebarCollapsed
            ? "w-[84px]"
            : "w-[276px]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        style={{
          color: "var(--admin-sidebar-text)",
          background: "var(--admin-sidebar)",
        }}
      >
        <button
          type="button"
          className="
            absolute -right-3 top-[92px] z-[60]
            hidden size-7 place-items-center rounded-full
            border shadow-md transition
            lg:grid
          "
          style={{
            color: "var(--muted)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
          aria-label={
            sidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            sidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          onClick={() =>
            setSidebarCollapsed(
              !sidebarCollapsed,
            )
          }
        >
          {sidebarCollapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>

        <div
          className={[
            "flex h-[72px] items-center border-b px-5",
            sidebarCollapsed
              ? "justify-center"
              : "justify-between",
          ].join(" ")}
          style={{
            borderColor:
              "color-mix(in srgb, var(--admin-sidebar-text) 12%, transparent)",
          }}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            {config?.logo_url ? (
              <img
                src={config.logo_url}
                alt=""
                className="size-10 shrink-0 rounded-xl object-contain"
              />
            ) : (
              <div
                className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold"
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

            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">
                  {config?.brand_short_name ??
                    config?.brand_name ??
                    "Banking"}
                </p>
                <span
                  className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider"
                  style={{
                    color: "#d7fff8",
                    background:
                      "color-mix(in srgb, var(--brand-primary) 75%, transparent)",
                  }}
                >
                  ADMIN
                </span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <nav className="admin-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="flex min-h-11 items-center gap-3.5 rounded-xl px-3.5 text-sm font-medium transition"
                  style={({ isActive }) => ({
                    color: isActive
                      ? "#fff"
                      : "var(--admin-sidebar-muted)",
                    background: isActive
                      ? "var(--admin-sidebar-soft)"
                      : "transparent",
                  })}
                >
                  <Icon
                    size={18}
                    className="shrink-0"
                  />
                  {!sidebarCollapsed ? (
                    <span>{item.label}</span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div
          className="border-t p-4"
          style={{
            borderColor:
              "color-mix(in srgb, var(--admin-sidebar-text) 12%, transparent)",
          }}
        >
          {!sidebarCollapsed ? (
            <div className="mb-2 flex items-center gap-3 rounded-xl p-2.5">
              <div
                className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold"
                style={{
                  color: "var(--admin-sidebar)",
                  background: "#dbe7f1",
                }}
              >
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {name}
                </p>
                <p
                  className="truncate text-[11px]"
                  style={{
                    color: "var(--admin-sidebar-muted)",
                  }}
                >
                  {user?.email}
                </p>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3.5 rounded-xl px-3.5 text-sm"
            style={{
              color: "var(--admin-sidebar-muted)",
            }}
            onClick={() =>
              void handleLogout()
            }
          >
            <LogOut
              size={18}
              className="shrink-0"
            />
            {!sidebarCollapsed ? (
              <span>Sign out</span>
            ) : null}
          </button>
        </div>
      </aside>
    </>
  );
}
