import {
  ArrowRightLeft,
  CreditCard,
  Landmark,
  ReceiptText,
  Snowflake,
  UserCheck,
  Users,
  WalletCards,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminDashboardSummary,
  getAdminRecentFinancial,
  getAdminUsers,
} from "@/api/admin";
import StatusBadge from "@/components/common/StatusBadge";
import { useAdminAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
} from "@/utils/format";

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgo(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return isoDate(value);
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Users;
}) {
  return (
    <article
      className="rounded-[var(--radius-card)] border p-5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]" style={{ color: "var(--text)" }}>
            {value}
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            {note}
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl" style={{ color: "var(--brand-accent)", background: "var(--surface-alt)" }}>
          <Icon size={18} />
        </span>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const today = useMemo(() => isoDate(new Date()), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const summaryQ = useQuery({
    queryKey: ["admin", "dashboard-summary", startDate, endDate],
    queryFn: () =>
      getAdminDashboardSummary({
        start_date: startDate,
        end_date: endDate,
      }),
  });

  const recentQ = useQuery({
    queryKey: ["admin", "dashboard-recent-financial", startDate, endDate],
    queryFn: () =>
      getAdminRecentFinancial({
        start_date: startDate,
        end_date: endDate,
        limit: 6,
      }),
  });

  const customersQ = useQuery({
    queryKey: ["admin", "dashboard-recent-customers"],
    queryFn: () =>
      getAdminUsers({
        limit: 6,
        offset: 0,
      }),
  });

  const s = summaryQ.data;
  const rangeLabel =
    startDate === endDate
      ? formatDate(`${startDate}T12:00:00`)
      : `${formatDate(`${startDate}T12:00:00`)} – ${formatDate(`${endDate}T12:00:00`)}`;

  function preset(days: number) {
    setEndDate(today);
    setStartDate(days === 1 ? today : daysAgo(days - 1));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--brand-accent)" }}>
            Operational overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl" style={{ color: "var(--text)" }}>
            Welcome back, {user?.first_name || "Admin"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Customer, account and money-movement activity at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-xl border p-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {[["Today", 1], ["7 days", 7], ["30 days", 30]].map(([label, days]) => (
            <button
              key={String(label)}
              type="button"
              className="h-9 rounded-lg px-3 text-xs font-semibold"
              style={{ color: "var(--muted)" }}
              onClick={() => preset(Number(days))}
            >
              {label}
            </button>
          ))}
          <label className="grid gap-1">
            <span className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>From</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              className="h-9 rounded-lg border px-2 text-xs outline-none"
              style={{ color: "var(--text)", background: "var(--surface)", borderColor: "var(--border)" }}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>To</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              className="h-9 rounded-lg border px-2 text-xs outline-none"
              style={{ color: "var(--text)", background: "var(--surface)", borderColor: "var(--border)" }}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
      </header>

      {summaryQ.isError ? (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 30%, var(--border))" }}>
          Dashboard metrics could not be loaded.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total customers" value={s?.customers.total.toLocaleString() ?? "—"} note={`${s?.customers.active ?? 0} active`} icon={Users} />
        <Metric label="Total accounts" value={s?.accounts.total.toLocaleString() ?? "—"} note={`${s?.accounts.frozen ?? 0} frozen`} icon={Landmark} />
        <Metric label="Transactions" value={s?.financial.transactions_count.toLocaleString() ?? "—"} note={rangeLabel} icon={ReceiptText} />
        <Metric label="Payments" value={s?.financial.payments_count.toLocaleString() ?? "—"} note={rangeLabel} icon={CreditCard} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active accounts" value={s?.accounts.active.toLocaleString() ?? "—"} note={`${s?.accounts.closed ?? 0} closed`} icon={UserCheck} />
        <Metric label="Frozen accounts" value={s?.accounts.frozen.toLocaleString() ?? "—"} note="Restricted customer accounts" icon={Snowflake} />
        <Metric label="Transfers" value={s?.financial.transfers_count.toLocaleString() ?? "—"} note={rangeLabel} icon={ArrowRightLeft} />
        <Metric label="Deposits" value={s?.financial.deposits_count.toLocaleString() ?? "—"} note={rangeLabel} icon={WalletCards} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link to={ROUTES.withdrawals}>
          <Metric
            label="Pending withdrawal review"
            value={s?.withdrawals.pending_review.toLocaleString() ?? "—"}
            note="Requests waiting for an administrator decision"
            icon={Clock3}
          />
        </Link>

        <Link to={ROUTES.withdrawals}>
          <Metric
            label="Processing withdrawals"
            value={s?.withdrawals.processing.toLocaleString() ?? "—"}
            note="Approved requests waiting for settlement"
            icon={LoaderCircle}
          />
        </Link>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recent financial activity</h2>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Most recent transactions in {rangeLabel}</p>
          </div>
          <Link to={ROUTES.transactions} className="text-xs font-semibold" style={{ color: "var(--brand-accent)" }}>View all</Link>
        </div>
        {recentQ.isLoading ? (
          <div className="border-t p-5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Loading financial activity...</div>
        ) : recentQ.data?.length ? (
          <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border)" }}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead style={{ background: "var(--surface-alt)" }}>
                <tr>{["Time","Reference","Type","Customer","Amount","Status"].map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recentQ.data.map((item) => (
                  <tr key={item.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{formatDateTime(item.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--brand-accent)" }}>{item.reference}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: "var(--text)" }}>{item.type.replaceAll("_"," ")}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text)" }}>{item.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: item.type === "deposit" || item.type === "admin_credit" ? "var(--success)" : "var(--text)" }}>{formatCurrency(item.amount, item.currency)}</td>
                    <td className="px-4 py-3"><StatusBadge label={item.status} tone={item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "warning"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-t p-5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>No financial activity in this date range.</div>
        )}
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recent registered customers</h2>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Most recently created customer profiles</p>
          </div>
          <Link to={ROUTES.customers} className="text-xs font-semibold" style={{ color: "var(--brand-accent)" }}>View all</Link>
        </div>
        {customersQ.isLoading ? (
          <div className="border-t p-5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Loading recent customers...</div>
        ) : customersQ.data?.items.length ? (
          <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border)" }}>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead style={{ background: "var(--surface-alt)" }}>
                <tr>{["Customer","Email","Status","Verified","Registered"].map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {customersQ.data.items.map((item) => (
                  <tr key={item.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{fullName(item)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{item.email}</td>
                    <td className="px-4 py-3"><StatusBadge label={item.is_active ? "Active" : "Inactive"} tone={item.is_active ? "success" : "danger"} /></td>
                    <td className="px-4 py-3"><StatusBadge label={item.is_verified ? "Verified" : "Unverified"} tone={item.is_verified ? "success" : "warning"} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-t p-5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>No customers yet.</div>
        )}
      </section>
    </div>
  );
}
