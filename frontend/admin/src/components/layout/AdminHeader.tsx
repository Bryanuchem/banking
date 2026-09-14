import {
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminNotificationUnreadCount } from "@/api/admin";
import {
  useNavigate,
} from "react-router-dom";

import ThemeToggle from "@/components/common/ThemeToggle";
import { useAdminAuth } from "@/context/AuthContext";
import { useAdminLayout } from "@/context/LayoutContext";
import { ROUTES } from "@/routes/paths";

export default function AdminHeader() {
  const { user, signOut } = useAdminAuth();
  const { setMobileOpen } =
    useAdminLayout();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] =
    useState(false);
  const unreadQ = useQuery({ queryKey: ["admin", "notifications", "unread-count"], queryFn: getAdminNotificationUnreadCount, refetchInterval: 30_000 });

  const name =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(" ") || "Administrator";

  async function logout() {
    await signOut();
    navigate(ROUTES.login, {
      replace: true,
    });
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b px-4 sm:px-6"
      style={{
        background:
          "color-mix(in srgb, var(--surface) 94%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl border lg:hidden"
          style={{
            color: "var(--text)",
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
          aria-label="Open navigation"
          onClick={() =>
            setMobileOpen(true)
          }
        >
          <Menu size={19} />
        </button>

        <div>
          <p
            className="text-[15px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            Admin Console
          </p>
          <p
            className="hidden text-xs sm:block"
            style={{ color: "var(--muted)" }}
          >
            Secure operational access
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-11 place-items-center rounded-xl border"
          style={{ color: "var(--muted)", background: "var(--surface)", borderColor: "var(--border)" }}
          onClick={() => navigate(ROUTES.notifications)}
        >
          <Bell size={18} />
          {(unreadQ.data?.unread ?? 0) > 0 ? (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: "var(--danger)" }}>
              {Math.min(unreadQ.data?.unread ?? 0, 99)}
            </span>
          ) : null}
        </button>

        <div className="relative">
          <button
            type="button"
            className="flex h-11 items-center gap-2.5 rounded-xl border px-3"
            style={{
              color: "var(--text)",
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
            onClick={() =>
              setMenuOpen((value) => !value)
            }
          >
            <span
              className="grid size-8 place-items-center rounded-full text-[11px] font-semibold"
              style={{
                color: "var(--brand-secondary)",
                background: "var(--surface-alt)",
              }}
            >
              {name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <span className="hidden max-w-40 truncate text-xs font-medium sm:block">
              {name}
            </span>

            <ChevronDown
              size={14}
              style={{ color: "var(--muted)" }}
            />
          </button>

          {menuOpen ? (
            <div
              className="absolute right-0 top-13 w-56 rounded-xl border p-2 shadow-xl"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="border-b px-2 pb-2"
                style={{
                  borderColor: "var(--border)",
                }}
              >
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {name}
                </p>
                <p
                  className="truncate text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {user?.email}
                </p>
              </div>

              <button
                type="button"
                className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm"
                style={{ color: "var(--text)" }}
                onClick={() => { setMenuOpen(false); navigate(ROUTES.profile); }}
              >
                Profile
              </button>

              <button
                type="button"
                className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm"
                style={{ color: "var(--danger)" }}
                onClick={() => void logout()}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
