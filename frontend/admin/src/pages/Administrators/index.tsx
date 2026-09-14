import { Plus, Search, UserPlus } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import {
  createAdminAdministrator,
  getAdminAdministrators,
  getAdminUsers,
  promoteAdminCustomer,
  setAdminAdministratorState,
} from "@/api/admin";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import SecurityHeader from "@/components/security/SecurityHeader";
import { useSnackbar } from "@/context/SnackbarContext";
import { requestAdminStepUp } from "@/utils/adminStepUp";
import { apiErrorMessage } from "@/utils/apiError";

export default function AdminAdministratorsPage() {
  const snackbar = useSnackbar();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [twoFactor, setTwoFactor] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showPromote, setShowPromote] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "administrators", q, status, twoFactor],
    queryFn: () =>
      getAdminAdministrators({
        q: q || undefined,
        status: status || undefined,
        two_factor: twoFactor || undefined,
        limit: 100,
        offset: 0,
      }),
  });

  const stateMutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const token = await requestAdminStepUp("admin:state");
      return setAdminAdministratorState(
        id,
        {
          is_active: isActive,
          reason: isActive
            ? "Reactivated from administrator console"
            : "Disabled from administrator console",
        },
        token,
      );
    },
    onSuccess: async () => {
      snackbar.showSnackbar("Administrator access updated.", "success");
      await client.invalidateQueries({
        queryKey: ["admin", "administrators"],
      });
      await client.invalidateQueries({
        queryKey: ["admin", "security"],
      });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "ACTION_CANCELLED") return;
      snackbar.showSnackbar(
        apiErrorMessage(error, "Administrator access could not be updated."),
        "error",
      );
    },
  });

  return (
    <div className="space-y-5">
      <SecurityHeader
        title="Administrators"
        description="Manage administrative users and access."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowPromote(true)}>
              <UserPlus size={15} />
              Promote customer
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={15} />
              Create administrator
            </Button>
          </div>
        }
      />

      <div
        className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_180px_180px]"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <label className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <input
            value={q}
            placeholder="Search administrators..."
            className="h-10 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          value={status}
          className="h-10 rounded-lg border bg-transparent px-3 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select
          value={twoFactor}
          className="h-10 rounded-lg border bg-transparent px-3 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          onChange={(e) => setTwoFactor(e.target.value)}
        >
          <option value="">All 2FA status</option>
          <option value="enabled">2FA enabled</option>
          <option value="disabled">2FA disabled</option>
        </select>
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-card)] border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead style={{ color: "var(--muted)", background: "var(--surface-alt)" }}>
              <tr>
                {["Name", "Email", "Type", "2FA", "Active sessions", "Last login", "Status", "Actions"].map(
                  (label) => (
                    <th key={label} className="px-4 py-3 text-xs font-semibold">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                    {item.first_name} {item.last_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {item.email}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.has_customer_account ? "Dual role" : "Admin only"}
                      tone={item.has_customer_account ? "warning" : "success"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.two_factor_enabled ? "Enabled" : "Disabled"}
                      tone={item.two_factor_enabled ? "success" : "danger"}
                    />
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {item.active_sessions}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                    {item.last_login_at
                      ? new Date(item.last_login_at).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={item.is_active ? "Active" : "Disabled"}
                      tone={item.is_active ? "success" : "danger"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-xs font-semibold"
                      style={{
                        color: item.is_active
                          ? "var(--danger)"
                          : "var(--success)",
                      }}
                      onClick={() =>
                        stateMutation.mutate({
                          id: item.id,
                          isActive: !item.is_active,
                        })
                      }
                    >
                      {item.is_active ? "Disable" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t px-4 py-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {query.data ? `${query.data.total} administrator(s)` : "Loading..."}
        </div>
      </div>

      {showCreate ? (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await client.invalidateQueries({ queryKey: ["admin", "administrators"] });
            await client.invalidateQueries({ queryKey: ["admin", "security"] });
          }}
        />
      ) : null}

      {showPromote ? (
        <PromoteAdminModal
          onClose={() => setShowPromote(false)}
          onPromoted={async () => {
            setShowPromote(false);
            await client.invalidateQueries({ queryKey: ["admin", "administrators"] });
            await client.invalidateQueries({ queryKey: ["admin", "security"] });
          }}
        />
      ) : null}
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
      <div
        className="w-full max-w-xl rounded-2xl border p-5 shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <button onClick={onClose} style={{ color: "var(--muted)" }}>×</button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function CreateAdminModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const snackbar = useSnackbar();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    temporary_password: "",
    is_active: true,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await requestAdminStepUp("admin:create");
      return createAdminAdministrator(form, token);
    },
    onSuccess: async () => {
      snackbar.showSnackbar("Administrator created.", "success");
      await onCreated();
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "ACTION_CANCELLED") return;
      snackbar.showSnackbar(
        apiErrorMessage(error, "Administrator could not be created."),
        "error",
      );
    },
  });

  return (
    <ModalShell title="Create Administrator" onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="First name"
          value={form.first_name}
          onChange={(value) => setForm({ ...form, first_name: value })}
        />
        <Field
          label="Last name"
          value={form.last_name}
          onChange={(value) => setForm({ ...form, last_name: value })}
        />
      </div>
      <div className="mt-3 space-y-3">
        <Field
          label="Email address"
          value={form.email}
          onChange={(value) => setForm({ ...form, email: value })}
        />
        <Field
          label="Temporary password"
          type="password"
          value={form.temporary_password}
          onChange={(value) =>
            setForm({ ...form, temporary_password: value })
          }
        />
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active account
        </label>
        <div
          className="rounded-xl border p-3 text-xs leading-5"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted)",
            background: "var(--surface-alt)",
          }}
        >
          New administrators do not receive a customer account. They should enable
          two-factor authentication immediately after first login.
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          loading={mutation.isPending}
          disabled={
            !form.first_name.trim() ||
            !form.last_name.trim() ||
            !form.email.trim() ||
            !form.temporary_password
          }
          onClick={() => mutation.mutate()}
        >
          Create administrator
        </Button>
      </div>
    </ModalShell>
  );
}

function PromoteAdminModal({
  onClose,
  onPromoted,
}: {
  onClose: () => void;
  onPromoted: () => Promise<void>;
}) {
  const snackbar = useSnackbar();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["admin", "promotion-customers", search],
    queryFn: () => getAdminUsers({ q: search || undefined, limit: 20, offset: 0 }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a customer.");
      const confirmed = window.confirm(
        "Promoting this customer grants administrator access while preserving their customer account. Continue?",
      );
      if (!confirmed) throw new Error("ACTION_CANCELLED");
      const token = await requestAdminStepUp("admin:promote");
      return promoteAdminCustomer(selected, token);
    },
    onSuccess: async () => {
      snackbar.showSnackbar("Customer promoted to administrator.", "success");
      await onPromoted();
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "ACTION_CANCELLED") return;
      snackbar.showSnackbar(
        apiErrorMessage(error, "Customer could not be promoted."),
        "error",
      );
    },
  });

  return (
    <ModalShell title="Promote existing customer" onClose={onClose}>
      <div
        className="mb-4 rounded-xl border p-3 text-xs leading-5"
        style={{
          color: "var(--warning)",
          borderColor: "color-mix(in srgb, var(--warning) 35%, var(--border))",
        }}
      >
        The customer keeps their existing banking account and gains full
        administrative access.
      </div>
      <Field label="Search customer" value={search} onChange={setSearch} />
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {users.data?.items
          .filter((item) => !item.is_admin)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between rounded-xl border p-3 text-left"
              style={{
                borderColor:
                  selected === item.id
                    ? "var(--brand-primary)"
                    : "var(--border)",
                background: "var(--surface-alt)",
              }}
              onClick={() => setSelected(item.id)}
            >
              <span>
                <span className="block text-sm font-medium" style={{ color: "var(--text)" }}>
                  {item.first_name} {item.last_name}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {item.email}
                </span>
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Customer account
              </span>
            </button>
          ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selected}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Promote customer
        </Button>
      </div>
    </ModalShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--text)" }}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
