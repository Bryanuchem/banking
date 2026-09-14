import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCcw,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAdminReconciliation,
  runAdminReconciliation,
} from "@/api/admin";
import Button from "@/components/common/Button";
import ExportCsvButton from "@/components/common/ExportCsvButton";
import SecurityHeader from "@/components/security/SecurityHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useSnackbar } from "@/context/SnackbarContext";
import { requestAdminStepUp } from "@/utils/adminStepUp";
import { apiErrorMessage } from "@/utils/apiError";

export default function AdminReconciliationPage() {
  const snackbar = useSnackbar();
  const client = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "reconciliation"],
    queryFn: getAdminReconciliation,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await requestAdminStepUp("admin:reconciliation");
      return runAdminReconciliation(token);
    },
    onSuccess: async (result) => {
      snackbar.showSnackbar(
        result.report.summary.status === "healthy"
          ? "Reconciliation completed. System is healthy."
          : "Reconciliation completed with items requiring review.",
        result.report.summary.status === "healthy" ? "success" : "warning",
      );
      await client.invalidateQueries({ queryKey: ["admin", "reconciliation"] });
      await client.invalidateQueries({ queryKey: ["admin", "security"] });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "ACTION_CANCELLED") return;
      snackbar.showSnackbar(
        apiErrorMessage(error, "Reconciliation could not be run."),
        "error",
      );
    },
  });

  const report = query.data;

  return (
    <div className="space-y-5">
      <SecurityHeader
        title="Reconciliation"
        description="Ensure data integrity across accounts, transactions and ledger."
        action={
          <div className="flex gap-2">
            <ExportCsvButton resource="reconciliation" params={{}} />
            <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
              <Play size={15} />
              Run reconciliation
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Accounts checked" value={report?.summary.checked ?? "—"} />
        <Metric label="Ledger balance total" value={money(report?.summary.ledger_balance_total)} />
        <Metric label="Account balance total" value={money(report?.summary.account_balance_total)} />
        <Metric label="Discrepancies" value={report?.summary.mismatched ?? "—"} danger={Boolean(report?.summary.mismatched)} />
        <Metric
          label="Unmatched transactions"
          value={report?.summary.unmatched_transactions ?? "—"}
          danger={Boolean(report?.summary.unmatched_transactions)}
        />
      </div>

      <div
        className="flex items-center gap-3 rounded-[var(--radius-card)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {report?.summary.status === "healthy" ? (
          <CheckCircle2 size={28} style={{ color: "var(--success)" }} />
        ) : (
          <AlertTriangle size={28} style={{ color: "var(--warning)" }} />
        )}
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>
            {report
              ? report.summary.status === "healthy"
                ? "System is healthy"
                : "Review required"
              : "Checking reconciliation health"}
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            Account and ledger balances are compared without mutating financial history.
          </p>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <RefreshCcw size={15} style={{ color: "var(--brand-accent)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Account reconciliation
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead style={{ background: "var(--surface-alt)", color: "var(--muted)" }}>
              <tr>
                {[
                  "Account",
                  "Customer",
                  "Ledger balance",
                  "Account balance",
                  "Difference",
                  "Held difference",
                  "Status",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report?.accounts.map((item) => (
                <tr key={item.account_id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text)" }}>
                    {item.account_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {item.customer_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {money(item.expected_available_balance)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {money(item.actual_available_balance)}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{
                    color: Number(item.available_difference) === 0
                      ? "var(--success)"
                      : "var(--danger)",
                  }}>
                    {money(item.available_difference)}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{
                    color: Number(item.held_difference) === 0
                      ? "var(--success)"
                      : "var(--danger)",
                  }}>
                    {money(item.held_difference)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.status}
                      tone={
                        item.status === "healthy"
                          ? "success"
                          : item.status === "warning"
                          ? "warning"
                          : "danger"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function money(value: string | undefined) {
  if (value == null) return "—";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div
      className="rounded-[var(--radius-card)] border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
      <div
        className="mt-2 text-xl font-semibold"
        style={{ color: danger ? "var(--danger)" : "var(--text)" }}
      >
        {value}
      </div>
    </div>
  );
}
