import {
  ArrowLeftRight,
  CircleUserRound,
  Clock3,
  Home,
  Landmark,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes/paths";

const items = [
  { to: ROUTES.dashboard, label: "Home", icon: Home, end: true },
  { to: ROUTES.transfer, label: "Transfer", icon: ArrowLeftRight },
  { to: ROUTES.activity, label: "Activity", icon: Clock3 },
  { to: ROUTES.withdraw, label: "Withdraw", icon: Landmark },
  { to: ROUTES.profile, label: "Profile", icon: CircleUserRound },
];

export default function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      style={{
        borderColor: "var(--border)",
        background:
          "color-mix(in srgb, var(--surface) 94%, transparent)",
      }}
      aria-label="Primary navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium"
            style={({ isActive }) => ({
              color: isActive
                ? "var(--brand-accent)"
                : "var(--muted)",
            })}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
