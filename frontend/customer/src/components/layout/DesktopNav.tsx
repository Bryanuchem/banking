import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes/paths";

const items = [
  { to: ROUTES.dashboard, label: "Home", end: true },
  { to: ROUTES.transfer, label: "Transfer" },
  { to: ROUTES.activity, label: "Activity" },
  { to: ROUTES.withdraw, label: "Withdraw" },
  { to: ROUTES.profile, label: "Profile" },
];

export default function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
      {items.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="rounded-lg px-3 py-2 text-sm font-medium transition"
          style={({ isActive }) => ({
            color: isActive ? "var(--text)" : "var(--muted)",
            background: isActive ? "var(--surface-alt)" : "transparent",
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
