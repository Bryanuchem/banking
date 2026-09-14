import {
  BadgeCheck,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Shield,
  Trash2,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminUser,
  setAdminUserState,
} from "@/api/admin";
import Button from "@/components/common/Button";
import CopyButton from "@/components/common/CopyButton";
import Drawer from "@/components/common/Drawer";
import DeleteCustomerAccountModal from "@/components/customers/DeleteCustomerAccountModal";
import StatusBadge from "@/components/common/StatusBadge";
import { useAdminAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { accountDetailPath } from "@/routes/paths";
import { apiErrorMessage } from "@/utils/apiError";
import {
  formatCurrency,
  formatDateTime,
  fullName,
} from "@/utils/format";

export default function CustomerDrawer({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { user: currentAdmin } = useAdminAuth();
  const snackbar = useSnackbar();
  const [reason, setReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const userQ = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => getAdminUser(userId!),
    enabled: Boolean(userId),
  });

  const stateMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!userId) throw new Error("Missing user");
      return setAdminUserState(userId, {
        is_active: isActive,
        reason: reason.trim() || null,
      });
    },
    onSuccess: async (_, isActive) => {
      setReason("");
      snackbar.showSnackbar(
        isActive
          ? "Customer reactivated."
          : "Customer disabled.",
        "success",
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "user", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "users"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard-summary"],
        }),
      ]);
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Customer state could not be changed.",
        ),
        "error",
      );
    },
  });

  const item = userQ.data;
  const isSelf = item?.id === currentAdmin?.id;

  return (
    <Drawer
      open={Boolean(userId)}
      title="Customer details"
      onClose={onClose}
    >
      {userQ.isLoading ? (
        <div
          className="p-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Loading customer...
        </div>
      ) : userQ.isError || !item ? (
        <div
          className="p-6 text-sm"
          style={{ color: "var(--danger)" }}
        >
          Customer details could not be loaded.
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold"
              style={{
                color: "var(--brand-secondary)",
                background: "var(--surface-alt)",
              }}
            >
              {item.first_name.slice(0, 1)}
              {item.last_name.slice(0, 1)}
            </div>

            <div className="min-w-0">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text)" }}
              >
                {fullName(item)}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge
                  label={
                    item.is_active
                      ? "Active"
                      : "Inactive"
                  }
                  tone={
                    item.is_active
                      ? "success"
                      : "danger"
                  }
                />
                <StatusBadge
                  label={
                    item.is_verified
                      ? "Verified"
                      : "Unverified"
                  }
                  tone={
                    item.is_verified
                      ? "success"
                      : "warning"
                  }
                />
                {item.is_admin ? (
                  <StatusBadge
                    label="Administrator"
                    tone="info"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Mail
                  size={15}
                  style={{ color: "var(--muted)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Email
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <p
                  className="min-w-0 flex-1 break-all text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {item.email}
                </p>
                <CopyButton
                  value={item.email}
                  label="Email"
                  compact
                />
              </div>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Phone
                  size={15}
                  style={{ color: "var(--muted)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Phone
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <p
                  className="min-w-0 flex-1 break-all text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {item.phone || "Not provided"}
                </p>
                {item.phone ? (
                  <CopyButton
                    value={item.phone}
                    label="Phone number"
                    compact
                  />
                ) : null}
              </div>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Calendar
                  size={15}
                  style={{ color: "var(--muted)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Joined
                </span>
              </div>
              <p
                className="mt-2 text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                {formatDateTime(item.created_at)}
              </p>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <BadgeCheck
                  size={15}
                  style={{ color: "var(--muted)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Last login
                </span>
              </div>
              <p
                className="mt-2 text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                {formatDateTime(item.last_login_at)}
              </p>
            </div>
          </div>

          <section className="mt-7">
            <div className="flex items-center gap-2">
              <CreditCard
                size={17}
                style={{ color: "var(--brand-accent)" }}
              />
              <h4
                className="font-semibold"
                style={{ color: "var(--text)" }}
              >
                Linked account
              </h4>
            </div>

            {item.account ? (
              <div
                className="mt-3 rounded-xl border p-4"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-alt)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className="font-mono text-sm font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {item.account.account_number}
                      </p>
                      <CopyButton
                        value={item.account.account_number}
                        label="Account number"
                        compact
                      />
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      Available{" "}
                      {formatCurrency(
                        item.account.available_balance,
                        item.account.currency,
                      )}
                      {" · "}Held{" "}
                      {formatCurrency(
                        item.account.held_balance,
                        item.account.currency,
                      )}
                    </p>
                  </div>
                  <StatusBadge
                    label={item.account.status}
                    tone={
                      item.account.status === "active"
                        ? "success"
                        : item.account.status === "frozen"
                          ? "warning"
                          : "neutral"
                    }
                  />
                </div>

                <Link
                  to={accountDetailPath(item.account.id)}
                  className="mt-4 inline-flex text-xs font-semibold"
                  style={{ color: "var(--brand-accent)" }}
                  onClick={onClose}
                >
                  View account
                </Link>
              </div>
            ) : (
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--muted)" }}
              >
                No linked virtual account.
              </p>
            )}
          </section>

          <section
            className="mt-7 border-t pt-6"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <Shield
                size={17}
                style={{ color: "var(--brand-accent)" }}
              />
              <h4
                className="font-semibold"
                style={{ color: "var(--text)" }}
              >
                Admin actions
              </h4>
            </div>

            {item.is_admin ? (
              <p
                className="mt-2 text-xs leading-5"
                style={{ color: "var(--warning)" }}
              >
                This profile has administrator privileges. State changes
                should be handled carefully.
              </p>
            ) : null}

            <div
              className="mt-4 rounded-xl border p-4"
              style={{
                borderColor: item.is_active
                  ? "color-mix(in srgb, var(--danger) 24%, var(--border))"
                  : "color-mix(in srgb, var(--success) 24%, var(--border))",
                background: item.is_active
                  ? "color-mix(in srgb, var(--danger) 4%, var(--surface))"
                  : "color-mix(in srgb, var(--success) 4%, var(--surface))",
              }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: item.is_active
                      ? "var(--danger)"
                      : "var(--success)",
                  }}
                >
                  {item.is_active
                    ? "Disable customer"
                    : "Reactivate customer"}
                </p>
                <p
                  className="mt-1 text-xs leading-5"
                  style={{ color: "var(--muted)" }}
                >
                  {item.is_active
                    ? "Disabling prevents this customer from signing in. Add a reason below for the audit record."
                    : "Reactivating restores customer sign-in access. Add a reason below for the audit record."}
                </p>
              </div>

              <label className="mt-4 block">
                <span
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Reason for this action
                </span>
                <textarea
                  value={reason}
                  maxLength={500}
                  rows={3}
                  placeholder="Optional reason for the audit log"
                  className="w-full resize-none rounded-xl border p-3 text-sm outline-none"
                  style={{
                    color: "var(--text)",
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                />
              </label>

              <div className="mt-3">
                {item.is_active ? (
                  <Button
                    variant="danger"
                    loading={stateMutation.isPending}
                    disabled={isSelf}
                    onClick={() =>
                      stateMutation.mutate(false)
                    }
                  >
                    Disable customer
                  </Button>
                ) : (
                  <Button
                    loading={stateMutation.isPending}
                    onClick={() =>
                      stateMutation.mutate(true)
                    }
                  >
                    Reactivate customer
                  </Button>
                )}
              </div>

              {isSelf ? (
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  You cannot disable your own administrator account.
                </p>
              ) : null}
            </div>

            {item.account ? (
              <button
                type="button"
                className="mt-6 flex w-full items-center gap-3 rounded-xl border p-4 text-left"
                style={{
                  color: "var(--danger)",
                  borderColor:
                    "color-mix(in srgb, var(--danger) 28%, var(--border))",
                  background:
                    "color-mix(in srgb, var(--danger) 5%, var(--surface))",
                }}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={18} />
                <div>
                  <p className="text-sm font-semibold">
                    Delete banking account
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    Balance must be zero. Financial history is retained.
                  </p>
                </div>
              </button>
            ) : null}
          </section>
        </div>
      )}
      {item ? (
        <DeleteCustomerAccountModal
          customer={item}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            setDeleteOpen(false);
            onClose();
          }}
        />
      ) : null}
    </Drawer>
  );
}
