import {
  AlertTriangle,
  Landmark,
  LockKeyhole,
} from "lucide-react";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  authorizeAccountDeletion,
  deleteCustomerAccount,
  getAccountDeletionStatus,
} from "@/api/accountDeletion";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import { ROUTES } from "@/routes/paths";

function money(value: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(value));
}

export default function DeleteAccountDialog({
  open,
  twoFactorEnabled,
  onCancel,
  onDeleted,
}: {
  open: boolean;
  twoFactorEnabled: boolean;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [confirmation, setConfirmation] =
    useState("");
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const statusQ = useQuery({
    queryKey: ["account", "deletion-status"],
    queryFn: getAccountDeletionStatus,
    enabled: open,
    refetchOnMount: "always",
  });

  const deleteM = useMutation({
    mutationFn: async () => {
      setError("");

      let authorization: string | undefined;
      if (twoFactorEnabled) {
        const stepUp =
          await authorizeAccountDeletion(
            code.trim(),
          );
        authorization =
          stepUp.authorization_token;
      }

      return deleteCustomerAccount(
        {
          confirmation: confirmation.trim(),
          reason: reason.trim() || null,
        },
        authorization,
      );
    },
    onSuccess: onDeleted,
    onError: (value) => {
      const errorValue = value as {
        response?: {
          data?: {
            detail?:
              | string
              | {
                  message?: string;
                };
          };
        };
      };
      const detail =
        errorValue.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail?.message ??
              "We couldn't delete the account.",
      );
    },
  });

  const status = statusQ.data;
  const hasAvailable =
    Number(status?.available_balance ?? "0") !== 0;
  const hasHeld =
    Number(status?.held_balance ?? "0") !== 0;
  const hasPending =
    Boolean(
      (status?.pending_deposits ?? 0) ||
        (status?.pending_withdrawals ?? 0),
    );

  return (
    <Modal
      open={open}
      onClose={deleteM.isPending ? () => {} : onCancel}
      title="Delete banking account"
      description="This permanently ends customer banking access. Financial history is retained for audit and reconciliation."
      dismissible={!deleteM.isPending}
    >
      <div className="space-y-4">
        <div
          className="flex gap-3 rounded-xl border p-4"
          style={{
            color: "var(--danger)",
            borderColor:
              "color-mix(in srgb, var(--danger) 25%, var(--border))",
            background:
              "color-mix(in srgb, var(--danger) 6%, var(--surface))",
          }}
        >
          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0"
          />
          <p className="text-sm leading-6">
            Deletion cannot be undone. Your ledger and transaction history
            remain stored, but this banking account cannot be used again.
          </p>
        </div>

        {statusQ.isLoading ? (
          <p
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            Checking account balance...
          </p>
        ) : status ? (
          <div
            className="rounded-xl border p-4"
            style={{
              background: "var(--surface-alt)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-2">
              <Landmark
                size={16}
                style={{
                  color: "var(--brand-accent)",
                }}
              />
              <strong
                className="font-mono text-sm"
                style={{ color: "var(--text)" }}
              >
                {status.account_number}
              </strong>
            </div>

            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt style={{ color: "var(--muted)" }}>
                  Available
                </dt>
                <dd style={{ color: "var(--text)" }}>
                  {money(
                    status.available_balance,
                    status.currency,
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt style={{ color: "var(--muted)" }}>
                  Held
                </dt>
                <dd style={{ color: "var(--text)" }}>
                  {money(
                    status.held_balance,
                    status.currency,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {(hasAvailable || hasHeld || hasPending) ? (
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--warning) 30%, var(--border))",
              background:
                "color-mix(in srgb, var(--warning) 7%, var(--surface))",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--warning)" }}
            >
              Clear the account first
            </p>
            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "var(--muted)" }}
            >
              Your available and held balances must both be zero, and pending
              deposits or withdrawals must be resolved before deletion.
            </p>

            <Link
              to={ROUTES.withdraw}
              className="mt-3 inline-flex"
              onClick={onCancel}
            >
              <Button>
                Withdraw / clear balance
              </Button>
            </Link>
          </div>
        ) : null}

        {status?.can_delete ? (
          <>
            <label className="block">
              <span
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Type your account number to confirm
              </span>
              <Input
                value={confirmation}
                placeholder={status.account_number}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="block">
              <span
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Reason (optional)
              </span>
              <textarea
                value={reason}
                maxLength={500}
                rows={2}
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

            {twoFactorEnabled ? (
              <label className="block">
                <span
                  className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  <LockKeyhole size={14} />
                  Authenticator or recovery code
                </span>
                <Input
                  value={code}
                  placeholder="Enter code"
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                />
              </label>
            ) : null}

            {error ? (
              <p
                className="text-sm"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                disabled={deleteM.isPending}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={deleteM.isPending}
                disabled={
                  confirmation !==
                    status.account_number ||
                  (twoFactorEnabled &&
                    !code.trim())
                }
                onClick={() => deleteM.mutate()}
              >
                Delete account
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
