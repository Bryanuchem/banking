import {
  AlertTriangle,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteAdminCustomerAccount,
} from "@/api/admin";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import type {
  AdminUserDetail,
} from "@/types/admin";
import { accountDetailPath } from "@/routes/paths";
import {
  apiErrorMessage,
} from "@/utils/apiError";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  formatCurrency,
} from "@/utils/format";

export default function DeleteCustomerAccountModal({
  customer,
  open,
  onClose,
  onDeleted,
}: {
  customer: AdminUserDetail;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const client = useQueryClient();
  const snackbar = useSnackbar();
  const [confirmation, setConfirmation] =
    useState("");
  const [reason, setReason] = useState("");

  const account = customer.account;
  const canDelete = Boolean(
    account &&
      Number(account.available_balance) === 0 &&
      Number(account.held_balance) === 0,
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (!account) {
        throw new Error(
          "Customer account is unavailable.",
        );
      }
      return deleteAdminCustomerAccount(
        customer.id,
        {
          confirmation,
          reason: reason.trim() || null,
        },
      );
    },
    onSuccess: async () => {
      snackbar.showSnackbar(
        "Customer banking account deleted. Financial history was preserved.",
        "success",
      );
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["admin", "users"],
        }),
        client.invalidateQueries({
          queryKey: ["admin", "accounts"],
        }),
        client.invalidateQueries({
          queryKey: ["admin", "dashboard-summary"],
        }),
      ]);
      onDeleted();
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Customer account could not be deleted.",
        ),
        "error",
      );
    },
  });

  if (!account) return null;

  return (
    <Modal
      open={open}
      title="Delete customer banking account"
      onClose={
        mutation.isPending ? () => {} : onClose
      }
    >
      <div className="p-5">
        <div
          className="flex gap-3 rounded-xl border p-4"
          style={{
            color: "var(--danger)",
            borderColor:
              "color-mix(in srgb, var(--danger) 28%, var(--border))",
            background:
              "color-mix(in srgb, var(--danger) 6%, var(--surface))",
          }}
        >
          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0"
          />
          <p className="text-sm leading-6">
            This permanently removes customer banking access while retaining
            the account row and all financial history for audit,
            reconciliation and transaction records.
          </p>
        </div>

        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt style={{ color: "var(--muted)" }}>
              Available
            </dt>
            <dd style={{ color: "var(--text)" }}>
              {formatCurrency(
                account.available_balance,
                account.currency,
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt style={{ color: "var(--muted)" }}>
              Held
            </dt>
            <dd style={{ color: "var(--text)" }}>
              {formatCurrency(
                account.held_balance,
                account.currency,
              )}
            </dd>
          </div>
        </dl>

        {!canDelete ? (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--warning) 28%, var(--border))",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--warning)" }}
            >
              Balance must be zero
            </p>
            <p
              className="mt-1 text-xs leading-5"
              style={{ color: "var(--muted)" }}
            >
              Admin deletion is not allowed while available or held funds
              remain.
            </p>
            <Link
              to={accountDetailPath(account.id)}
              className="mt-3 inline-flex text-sm font-semibold"
              style={{
                color: "var(--brand-accent)",
              }}
              onClick={onClose}
            >
              View account
            </Link>
          </div>
        ) : (
          <>
            <label className="mt-5 block">
              <span
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Type {account.account_number} to confirm
              </span>
              <Input
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="mt-4 block">
              <span
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Administrative reason
              </span>
              <textarea
                value={reason}
                rows={3}
                maxLength={500}
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
          </>
        )}


        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          {canDelete ? (
            <Button
              variant="danger"
              loading={mutation.isPending}
              disabled={
                confirmation !==
                account.account_number
              }
              onClick={() => mutation.mutate()}
            >
              Delete account
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
