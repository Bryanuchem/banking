import {
  AlertTriangle,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { setAdminAccountState } from "@/api/admin";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import type { AdminAccountDetail } from "@/types/admin";
import { apiErrorMessage } from "@/utils/apiError";
import { useSnackbar } from "@/context/SnackbarContext";

type TargetState = "active" | "frozen" | "closed";

export default function AccountStateModal({
  account,
  target,
  open,
  onClose,
}: {
  account: AdminAccountDetail;
  target: TargetState;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] =
    useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setConfirmation("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      setAdminAccountState(account.id, {
        status: target,
        reason: reason.trim() || null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "account", account.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "accounts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard-summary"],
        }),
      ]);
      snackbar.showSnackbar(
        target === "active"
          ? "Account reactivated."
          : target === "frozen"
            ? "Account frozen."
            : "Account closed.",
        "success",
      );
      onClose();
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Account state could not be changed.",
        ),
        "error",
      );
    },
  });

  const title =
    target === "frozen"
      ? "Freeze account"
      : target === "closed"
        ? "Close account"
        : "Reactivate account";

  const confirmRequired =
    target === "closed";
  const canSubmit =
    !confirmRequired ||
    confirmation === account.account_number;

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
    >
      <div className="p-5">
        <div
          className="flex gap-3 rounded-xl border p-4"
          style={{
            color:
              target === "active"
                ? "var(--success)"
                : target === "frozen"
                  ? "var(--warning)"
                  : "var(--danger)",
            borderColor: "var(--border)",
            background: "var(--surface-alt)",
          }}
        >
          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0"
          />
          <div className="text-sm leading-6">
            {target === "frozen"
              ? "Freezing this account restricts customer money movement until an administrator reactivates it."
              : target === "closed"
                ? "Closing an account is a sensitive action. The backend will refuse closure while funds or holds remain."
                : "Reactivating returns the account to normal active state."}
          </div>
        </div>


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
            maxLength={500}
            className="w-full resize-none rounded-xl border p-3 text-sm outline-none"
            style={{
              color: "var(--text)",
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
            placeholder="Reason for the audit log"
            onChange={(event) =>
              setReason(event.target.value)
            }
          />
        </label>

        {confirmRequired ? (
          <label className="mt-4 block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Type {account.account_number} to confirm
            </span>
            <Input
              value={confirmation}
              onChange={(event) =>
                setConfirmation(event.target.value)
              }
            />
          </label>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={
              target === "closed"
                ? "danger"
                : "primary"
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
