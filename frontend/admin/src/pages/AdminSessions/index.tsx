import { Search, ShieldAlert } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import {
  getAdminSessions,
  revokeAdminSession,
  revokeAllAdminUserSessions,
} from "@/api/admin";
import SecurityHeader from "@/components/security/SecurityHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useSnackbar } from "@/context/SnackbarContext";
import { requestAdminStepUp } from "@/utils/adminStepUp";
import { apiErrorMessage } from "@/utils/apiError";

export default function AdminSessionsPage() {
  const snackbar = useSnackbar();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState("active");

  const query = useQuery({
    queryKey: ["admin", "sessions", q, userType, status],
    queryFn: () =>
      getAdminSessions({
        q: q || undefined,
        user_type: userType || undefined,
        status: status || undefined,
        limit: 100,
        offset: 0,
      }),
  });

  const revoke = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!window.confirm("Revoke this session?")) {
        throw new Error("ACTION_CANCELLED");
      }
      const token = await requestAdminStepUp("admin:sessions");
      return revokeAdminSession(sessionId, token);
    },
    onSuccess: async () => {
      snackbar.showSnackbar("Session revoked.", "success");
      await client.invalidateQueries({ queryKey: ["admin", "sessions"] });
      await client.invalidateQueries({ queryKey: ["admin", "security"] });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "ACTION_CANCELLED") return;
      snackbar.showSnackbar(
        apiErrorMessage(error, "Session could not be revoked."),
        "error",
      );
    },
  });

  const revokeAll = useMutation({
    mutationFn: async (userId: string) => {
      if (!window.confirm("Revoke all active sessions for this user?")) {
        throw new Error("ACTION_CANCELLED");
      }
      const token = await requestAdminStepUp("admin:sessions");
      return revokeAllAdminUserSessions(userId, token);
    },
    onSuccess: async (result) => {
      snackbar.showSnackbar(
        `${result.count} session(s) revoked.`,
        "success",
      );
      await client.invalidateQueries({ queryKey: ["admin", "sessions"] });
      await client.invalidateQueries({ queryKey: ["admin", "security"] });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "ACTION_CANCELLED") return;
      snackbar.showSnackbar(
        apiErrorMessage(error, "Sessions could not be revoked."),
        "error",
      );
    },
  });

  return (
    <div className="space-y-5">
      <SecurityHeader
        title="System Sessions"
        description="Monitor and manage all user sessions."
      />

      <div
        className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_170px_170px]"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <label className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <input
            value={q}
            placeholder="Search users, IP, or device..."
            className="h-10 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          value={userType}
          className="h-10 rounded-lg border bg-transparent px-3 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="">All users</option>
          <option value="administrator">Administrators</option>
          <option value="customer">Customers</option>
        </select>
        <select
          value={status}
          className="h-10 rounded-lg border bg-transparent px-3 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead style={{ background: "var(--surface-alt)", color: "var(--muted)" }}>
              <tr>
                {["User", "Type", "IP address", "Device / user agent", "Created", "Last seen", "Status", "Actions"].map(
                  (label) => (
                    <th key={label} className="px-4 py-3 text-xs font-semibold">{label}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--text)" }}>
                      {item.user_name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {item.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.user_type === "administrator" ? "Administrator" : "Customer"}
                      tone={item.user_type === "administrator" ? "warning" : "success"}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>
                    {item.ip_address ?? "—"}
                  </td>
                  <td className="max-w-[300px] truncate px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                    {item.user_agent ?? "Unknown device"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                    {item.last_seen_at ? new Date(item.last_seen_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.current ? "Current" : item.status}
                      tone={
                        item.status === "active"
                          ? "success"
                          : item.status === "revoked"
                          ? "danger"
                          : "warning"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {item.status === "active" && !item.current ? (
                        <button
                          className="text-xs font-semibold"
                          style={{ color: "var(--danger)" }}
                          onClick={() => revoke.mutate(item.id)}
                        >
                          Revoke
                        </button>
                      ) : null}
                      {item.status === "active" ? (
                        <button
                          className="text-xs font-semibold"
                          style={{ color: "var(--brand-accent)" }}
                          onClick={() => revokeAll.mutate(item.user_id)}
                        >
                          Revoke all
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t px-4 py-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <ShieldAlert size={14} />
          Current administrator session is protected from remote revocation.
        </div>
      </div>
    </div>
  );
}
