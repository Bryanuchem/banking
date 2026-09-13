import {
  ArrowLeft,
  Check,
  Circle,
  XCircle,
} from "lucide-react";

import {
  Button,
  ConfirmDialog,
  CopyButton,
} from "@/components/common";
import { useState } from "react";
import type { Withdrawal } from "@/types/withdrawals";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";
import {
  canCancelWithdrawal,
  withdrawalStatusLabel,
} from "@/utils/withdrawal";
import WithdrawalStatusBadge from "./WithdrawalStatusBadge";

type Props = {
  withdrawal: Withdrawal;
  cancelling: boolean;
  onBack: () => void;
  onPayFee: () => void;
  onCancel: () => void;
};

const steps = [
  "fee_paid",
  "pending_review",
  "processing",
  "completed",
] as const;

function reached(
  current: string,
  target: (typeof steps)[number],
) {
  const normalized =
    current === "pending" ? "pending_review" : current;

  const currentIndex = steps.indexOf(
    normalized as (typeof steps)[number],
  );
  const targetIndex = steps.indexOf(target);

  return currentIndex >= targetIndex;
}

export default function WithdrawalDetails({
  withdrawal,
  cancelling,
  onBack,
  onPayFee,
  onCancel,
}: Props) {
  const [confirmCancel, setConfirmCancel] =
    useState(false);

  const terminalFailure = [
    "rejected",
    "failed",
    "cancelled",
  ].includes(withdrawal.status);

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={17} />
        Withdrawals
      </button>

      <div className="text-center">
        <WithdrawalStatusBadge
          status={withdrawal.status}
        />
        <h1
          className="mt-3 text-3xl font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {formatCurrency(
            withdrawal.amount,
            withdrawal.currency,
          )}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span
            className="max-w-[260px] truncate text-xs"
            style={{ color: "var(--muted)" }}
          >
            Reference: {withdrawal.id}
          </span>
          <CopyButton
            value={withdrawal.id}
            successMessage="Withdrawal reference copied."
          />
        </div>
      </div>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5 sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {withdrawal.status === "awaiting_fee" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle
                size={20}
                style={{ color: "var(--warning)" }}
              />
              <div>
                <p
                  className="font-medium"
                  style={{ color: "var(--text)" }}
                >
                  Fee required
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  Pay the processing fee to submit this withdrawal for review.
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={onPayFee}
            >
              Pay processing fee
            </Button>
          </div>
        ) : terminalFailure ? (
          <div className="flex items-start gap-3">
            <XCircle
              size={20}
              style={{
                color:
                  withdrawal.status === "cancelled"
                    ? "var(--muted)"
                    : "var(--danger)",
              }}
            />
            <div>
              <p
                className="font-medium"
                style={{ color: "var(--text)" }}
              >
                {withdrawalStatusLabel(
                  withdrawal.status,
                )}
              </p>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--muted)" }}
              >
                The held withdrawal amount has been released back to your
                available balance.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {steps.map((step, index) => {
              const done = reached(
                withdrawal.status,
                step,
              );

              return (
                <div
                  key={step}
                  className="flex items-start gap-3"
                >
                  <div className="relative">
                    <div
                      className="grid size-6 place-items-center rounded-full border"
                      style={{
                        color: done
                          ? "var(--success)"
                          : "var(--muted)",
                        borderColor: done
                          ? "var(--success)"
                          : "var(--border)",
                        background: done
                          ? "color-mix(in srgb, var(--success) 10%, var(--surface))"
                          : "var(--surface)",
                      }}
                    >
                      {done ? (
                        <Check size={14} />
                      ) : (
                        <Circle size={10} />
                      )}
                    </div>

                    {index < steps.length - 1 ? (
                      <div
                        className="absolute left-1/2 top-7 h-6 w-px -translate-x-1/2"
                        style={{
                          background: done
                            ? "var(--success)"
                            : "var(--border)",
                        }}
                      />
                    ) : null}
                  </div>

                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: done
                          ? "var(--text)"
                          : "var(--muted)",
                      }}
                    >
                      {withdrawalStatusLabel(step)}
                    </p>
                    {done && index === 0 ? (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        Processing fee verified
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          className="my-5 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span style={{ color: "var(--muted)" }}>
              Withdrawal amount
            </span>
            <strong style={{ color: "var(--text)" }}>
              {formatCurrency(
                withdrawal.amount,
                withdrawal.currency,
              )}
            </strong>
          </div>

          <div className="flex justify-between gap-4">
            <span style={{ color: "var(--muted)" }}>
              Processing fee
            </span>
            <span style={{ color: "var(--text)" }}>
              {formatCurrency(
                withdrawal.fee_amount,
                withdrawal.currency,
              )}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span style={{ color: "var(--muted)" }}>
              Destination
            </span>
            <span
              className="text-right"
              style={{ color: "var(--text)" }}
            >
              {withdrawal.destination_bank_name}
              <br />
              <span style={{ color: "var(--muted)" }}>
                ••••{" "}
                {withdrawal.destination_account_number.slice(
                  -4,
                )}
              </span>
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span style={{ color: "var(--muted)" }}>
              Created
            </span>
            <span style={{ color: "var(--text)" }}>
              {formatDateTime(withdrawal.created_at)}
            </span>
          </div>
        </div>

        {canCancelWithdrawal(withdrawal.status) ? (
          <Button
            className="mt-6 w-full"
            variant="secondary"
            loading={cancelling}
            onClick={() => setConfirmCancel(true)}
          >
            Cancel withdrawal
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel withdrawal?"
        description="The held withdrawal amount will be released back to your available balance. Any processing fee already paid is not automatically refunded."
        confirmLabel="Cancel withdrawal"
        cancelLabel="Keep withdrawal"
        destructive
        loading={cancelling}
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
