import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getAdminSecurityOverview } from "@/api/admin";
import SecurityHeader from "@/components/security/SecurityHeader";
import { ROUTES } from "@/routes/paths";

export default function AdminSecurityPage() {
  const query = useQuery({
    queryKey: ["admin", "security", "overview"],
    queryFn: getAdminSecurityOverview,
  });

  const data = query.data;
  const status = data?.summary.reconciliation_status;

  return (
    <div className="space-y-5">
      <SecurityHeader
        title="Security Overview"
        description="Monitor and manage your platform security."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Administrators"
          value={data?.summary.administrators ?? "—"}
          note="Administrative identities"
          icon={Users}
        />
        <Metric
          label="Active admin sessions"
          value={data?.summary.active_admin_sessions ?? "—"}
          note="Currently valid sessions"
          icon={KeyRound}
        />
        <Metric
          label="Admins without 2FA"
          value={data?.summary.admins_without_2fa ?? "—"}
          note="Requires attention"
          icon={AlertTriangle}
          warning
        />
        <Metric
          label="Failed admin attempts"
          value={data?.summary.failed_admin_attempts ?? "—"}
          note="Current failed-login counters"
          icon={UserRoundCheck}
        />
        <Metric
          label="Reconciliation"
          value={
            status
              ? status[0].toUpperCase() + status.slice(1)
              : "—"
          }
          note={
            data
              ? `${data.summary.reconciliation_mismatched} mismatch(es)`
              : "Checking ledger health"
          }
          icon={
            status === "healthy"
              ? CheckCircle2
              : RefreshCcw
          }
          warning={status !== "healthy"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card
          title="Password policy"
          description="Current authentication policy"
        >
          {data ? (
            <div className="space-y-3 text-sm">
              <Policy
                ok
                text={`Minimum length: ${data.policy.password_min_length} characters`}
              />
              <Policy
                ok={data.policy.require_uppercase}
                text="Require uppercase letters"
              />
              <Policy
                ok={data.policy.require_numbers}
                text="Require numbers"
              />
              <Policy
                ok={data.policy.require_special_characters}
                text="Require special characters"
              />
            </div>
          ) : (
            <Muted>Loading policy...</Muted>
          )}
          <LinkButton to={`${ROUTES.settings}?tab=rules`}>
            Configure policy
          </LinkButton>
        </Card>

        <Card
          title="Two-factor authentication"
          description="Administrator security posture"
        >
          <div className="grid place-items-center py-4">
            <div
              className="grid size-28 place-items-center rounded-full border-8 text-2xl font-bold"
              style={{
                borderColor:
                  data?.summary.admins_without_2fa === 0
                    ? "var(--success)"
                    : "var(--warning)",
                color: "var(--text)",
              }}
            >
              {data
                ? `${Math.max(
                    data.summary.administrators -
                      data.summary.admins_without_2fa,
                    0,
                  )}/${data.summary.administrators}`
                : "—"}
            </div>
            <p
              className="mt-3 text-xs"
              style={{ color: "var(--muted)" }}
            >
              administrators protected with 2FA
            </p>
          </div>
          <LinkButton to={ROUTES.administrators}>
            View administrators
          </LinkButton>
        </Card>

        <Card
          title="Quick actions"
          description="Security and operations"
        >
          <QuickLink to={ROUTES.administrators} icon={Users}>
            Manage administrators
          </QuickLink>
          <QuickLink to={ROUTES.sessions} icon={KeyRound}>
            View active sessions
          </QuickLink>
          <QuickLink to={ROUTES.auditLogs} icon={ShieldCheck}>
            Browse audit logs
          </QuickLink>
          <QuickLink to={ROUTES.reconciliation} icon={RefreshCcw}>
            Run reconciliation
          </QuickLink>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  warning = false,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  warning?: boolean;
}) {
  return (
    <div
      className="rounded-[var(--radius-card)] border p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--muted)" }}
        >
          {label}
        </span>
        <Icon
          size={17}
          style={{
            color: warning
              ? "var(--warning)"
              : "var(--brand-accent)",
          }}
        />
      </div>
      <div
        className="mt-3 text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        {value}
      </div>
      <div
        className="mt-1 text-[11px]"
        style={{
          color: warning
            ? "var(--warning)"
            : "var(--muted)",
        }}
      >
        {note}
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[var(--radius-card)] border p-5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <h2 style={{ color: "var(--text)" }} className="font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
        {description}
      </p>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function Policy({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
      ) : (
        <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
      )}
      <span style={{ color: "var(--text)" }}>{text}</span>
    </div>
  );
}

function LinkButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="mt-4 flex h-10 items-center justify-center rounded-xl border text-xs font-semibold"
      style={{
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {children}
    </Link>
  );
}

function QuickLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium"
      style={{
        borderColor: "var(--border)",
        color: "var(--text)",
        background: "var(--surface-alt)",
      }}
    >
      <Icon size={16} style={{ color: "var(--brand-accent)" }} />
      {children}
    </Link>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm" style={{ color: "var(--muted)" }}>{children}</p>;
}
