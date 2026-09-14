import {
  ClipboardList,
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes/paths";

const items = [
  ["Overview", ROUTES.security, ShieldCheck],
  ["Administrators", ROUTES.administrators, Users],
  ["Sessions", ROUTES.sessions, KeyRound],
  ["Audit Logs", ROUTES.auditLogs, ClipboardList],
  ["Reconciliation", ROUTES.reconciliation, RefreshCcw],
] as const;

export default function SecurityNav() {
  return (
    <div
      className="flex gap-2 overflow-x-auto rounded-xl border p-2"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {items.map(([label, to, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end={to === ROUTES.security}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
          style={({ isActive }) => ({
            color: isActive ? "#fff" : "var(--muted)",
            background: isActive
              ? "var(--brand-primary)"
              : "transparent",
          })}
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
