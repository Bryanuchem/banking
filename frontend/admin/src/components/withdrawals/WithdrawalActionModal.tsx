import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import {
  approveAdminWithdrawal,
  completeAdminWithdrawal,
  failAdminWithdrawal,
  rejectAdminWithdrawal,
} from "@/api/admin";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import { useSnackbar } from "@/context/SnackbarContext";
import type {
  AdminWithdrawalDetail,
} from "@/types/admin";
import { apiErrorMessage } from "@/utils/apiError";
import { formatCurrency } from "@/utils/format";

type Action =
  | "approve"
  | "reject"
  | "complete"
  | "fail";

export default function WithdrawalActionModal({
  withdrawal,
  action,
  onClose,
}: {
  withdrawal: AdminWithdrawalDetail;
  action: Action | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const snackbar = useSnackbar();
  const [reason, setReason] = useState("");
  const [adminNote, setAdminNote] =
    useState("");
  const [externalReference, setExternalReference] =
    useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (action === "approve") {
        return approveAdminWithdrawal(
          withdrawal.id,
          adminNote,
        );
      }

      if (action === "reject") {
        return rejectAdminWithdrawal(
          withdrawal.id,
          reason.trim(),
        );
      }

      if (action === "complete") {
        return completeAdminWithdrawal(
          withdrawal.id,
          {
            external_reference:
              externalReference.trim(),
            admin_note: adminNote,
          },
        );
      }

      if (action === "fail") {
        return failAdminWithdrawal(
          withdrawal.id,
          reason.trim(),
        );
      }

      throw new Error("Missing action");
    },
    onSuccess: async () => {
      const messages = {
        approve:
          "Withdrawal approved and moved to processing.",
        reject:
          "Withdrawal rejected and held funds released.",
        complete:
          "Withdrawal completed and held funds consumed.",
        fail:
          "Withdrawal marked failed and held funds released.",
      };

      snackbar.showSnackbar(
        messages[action!],
        "success",
      );

      await Promise.all([
        client.invalidateQueries({
          queryKey: [
            "admin",
            "withdrawal",
            withdrawal.id,
          ],
        }),
        client.invalidateQueries({
          queryKey: ["admin", "withdrawals"],
        }),
        client.invalidateQueries({
          queryKey: [
            "admin",
            "dashboard-summary",
          ],
        }),
      ]);

      onClose();
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Withdrawal action could not be completed.",
        ),
        "error",
      );
    },
  });

  if (!action) return null;

  const title = {
    approve: "Approve withdrawal",
    reject: "Reject withdrawal",
    complete: "Complete withdrawal",
    fail: "Mark withdrawal failed",
  }[action];

  const destructive =
    action === "reject" || action === "fail";

  const canSubmit =
    action === "approve"
      ? Boolean(withdrawal.fee_payment)
      : action === "complete"
        ? Boolean(externalReference.trim())
        : Boolean(reason.trim());

  return (
    <Modal
      open
      title={title}
      onClose={
        mutation.isPending ? () => {} : onClose
      }
    >
      <div className="p-5">
        <div
          className="flex gap-3 rounded-xl border p-4"
          style={{
            color: destructive
              ? "var(--danger)"
              : "var(--brand-accent)",
            background: "var(--surface-alt)",
            borderColor: "var(--border)",
          }}
        >
          {destructive ? (
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />
          ) : (
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />
          )}

          <div className="text-sm leading-6">
            {action === "approve"
              ? "This moves the request into processing. The customer's withdrawal amount remains held."
              : action === "reject"
                ? "Rejecting releases the full held withdrawal amount back to the customer's available balance."
                : action === "complete"
                  ? "Completion permanently consumes the held amount. Provide the external transfer/reference first."
                  : "Marking this failed releases the held withdrawal amount back to the customer's available balance."}
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span style={{ color: "var(--muted)" }}>
              Customer
            </span>
            <strong style={{ color: "var(--text)" }}>
              {withdrawal.customer.name}
            </strong>
          </div>
          <div className="flex justify-between gap-4">
            <span style={{ color: "var(--muted)" }}>
              Amount
            </span>
            <strong style={{ color: "var(--text)" }}>
              {formatCurrency(
                withdrawal.amount,
                withdrawal.currency,
              )}
            </strong>
          </div>
          {action === "approve" ? (
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>
                Fee verified
              </span>
              <strong
                style={{
                  color: withdrawal.fee_payment
                    ? "var(--success)"
                    : "var(--danger)",
                }}
              >
                {withdrawal.fee_payment
                  ? "Yes"
                  : "No"}
              </strong>
            </div>
          ) : null}
        </div>

        {action === "reject" ||
        action === "fail" ? (
          <label className="mt-5 block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Reason
            </span>
            <textarea
              value={reason}
              rows={3}
              maxLength={1000}
              placeholder="Reason for this decision"
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
        ) : null}

        {action === "complete" ? (
          <label className="mt-5 block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              External transfer/reference
            </span>
            <Input
              value={externalReference}
              placeholder="Enter external reference"
              onChange={(event) =>
                setExternalReference(
                  event.target.value,
                )
              }
            />
          </label>
        ) : null}

        {action === "approve" ||
        action === "complete" ? (
          <label className="mt-4 block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Admin note (optional)
            </span>
            <textarea
              value={adminNote}
              rows={3}
              maxLength={1000}
              placeholder="Add an operational note"
              className="w-full resize-none rounded-xl border p-3 text-sm outline-none"
              style={{
                color: "var(--text)",
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
              onChange={(event) =>
                setAdminNote(event.target.value)
              }
            />
          </label>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={
              destructive ? "danger" : "primary"
            }
            disabled={!canSubmit}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {title}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
