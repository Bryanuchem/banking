import {
  Landmark,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { creditAdminAccount } from "@/api/admin";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import type {
  AdminAccountDetail,
  AdminCreditResponse,
} from "@/types/admin";
import { apiErrorMessage } from "@/utils/apiError";
import { formatCurrency } from "@/utils/format";
import { useSnackbar } from "@/context/SnackbarContext";

export default function CreditAccountModal({
  account,
  open,
  onClose,
}: {
  account: AdminAccountDetail;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [amount, setAmount] = useState("");
  const [description, setDescription] =
    useState("Administrative credit");
  const [idempotencyKey, setIdempotencyKey] =
    useState("");
  const [receipt, setReceipt] =
    useState<AdminCreditResponse | null>(null);

  useEffect(() => {
    if (open && !idempotencyKey) {
      setIdempotencyKey(crypto.randomUUID());
    }

    if (!open) {
      setAmount("");
      setDescription("Administrative credit");
      setIdempotencyKey("");
      setReceipt(null);
    }
  }, [open, idempotencyKey]);

  const mutation = useMutation({
    mutationFn: () =>
      creditAdminAccount(
        account.id,
        {
          amount,
          description: description.trim(),
        },
        idempotencyKey,
      ),
    onSuccess: async (data) => {
      setReceipt(data);
      snackbar.showSnackbar(
        "Account credited successfully.",
        "success",
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "account", account.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "accounts"],
        }),
      ]);
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Account could not be credited.",
        ),
        "error",
      );
    },
  });

  const validAmount =
    Number(amount) > 0 &&
    description.trim().length > 0;

  return (
    <Modal
      open={open}
      title={receipt ? "Credit completed" : "Credit account"}
      onClose={onClose}
    >
      {receipt ? (
        <div className="p-5">
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--success) 30%, var(--border))",
              background:
                "color-mix(in srgb, var(--success) 6%, var(--surface))",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--success)" }}
            >
              Account credited successfully
            </p>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            {[
              ["Account", receipt.account_number],
              [
                "Amount",
                formatCurrency(
                  receipt.amount,
                  receipt.currency,
                ),
              ],
              ["Reference", receipt.reference],
              [
                "New balance",
                formatCurrency(
                  receipt.balance_after,
                  receipt.currency,
                ),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b pb-3"
                style={{ borderColor: "var(--border)" }}
              >
                <dt style={{ color: "var(--muted)" }}>
                  {label}
                </dt>
                <dd
                  className="text-right font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <Button
            className="mt-5 w-full"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="p-5">
          <div
            className="flex items-center justify-between gap-4 rounded-xl border p-4"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-alt)",
            }}
          >
            <div className="flex items-center gap-3">
              <Landmark
                size={20}
                style={{ color: "var(--brand-accent)" }}
              />
              <div>
                <p
                  className="font-mono text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {account.account_number}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Current available balance
                </p>
              </div>
            </div>
            <strong style={{ color: "var(--text)" }}>
              {formatCurrency(
                account.available_balance,
                account.currency,
              )}
            </strong>
          </div>


          <label className="mt-5 block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Amount ({account.currency})
            </span>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              placeholder="0.00"
              onChange={(event) =>
                setAmount(event.target.value)
              }
            />
          </label>

          <label className="mt-4 block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Description
            </span>
            <textarea
              value={description}
              rows={3}
              className="w-full resize-none rounded-xl border p-3 text-sm outline-none"
              style={{
                color: "var(--text)",
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />
          </label>

          <div
            className="mt-4 rounded-xl border px-3 py-2 text-xs leading-5"
            style={{
              color: "var(--muted)",
              borderColor: "var(--border)",
              background: "var(--surface-alt)",
            }}
          >
            This creates a completed administrative credit ledger entry
            and an audit log record. Retrying this dialog uses the same
            idempotency key until it succeeds.
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!validAmount}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Review & credit
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
