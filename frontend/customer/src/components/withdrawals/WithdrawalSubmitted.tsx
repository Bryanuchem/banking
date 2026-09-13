import { CheckCircle2 } from "lucide-react";

import {
  Button,
  CopyButton,
} from "@/components/common";
import type { Withdrawal } from "@/types/withdrawals";
import { formatCurrency } from "@/utils/formatCurrency";
import WithdrawalStatusBadge from "./WithdrawalStatusBadge";

type Props = {
  withdrawal: Withdrawal;
  onView: () => void;
  onDone: () => void;
};

export default function WithdrawalSubmitted({
  withdrawal,
  onView,
  onDone,
}: Props) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-full"
        style={{
          color: "var(--success)",
          background:
            "color-mix(in srgb, var(--success) 12%, var(--surface))",
        }}
      >
        <CheckCircle2 size={30} />
      </div>

      <h1
        className="mt-4 text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        {withdrawal.status === "awaiting_fee"
          ? "Withdrawal created"
          : "Withdrawal submitted"}
      </h1>

      <p
        className="mt-2 text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        {withdrawal.status === "awaiting_fee"
          ? "Pay the processing fee to submit this withdrawal for review."
          : "Your withdrawal has been submitted for review."}
      </p>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5 text-left"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              Withdrawal amount
            </p>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {formatCurrency(
                withdrawal.amount,
                withdrawal.currency,
              )}
            </p>
          </div>

          <WithdrawalStatusBadge
            status={withdrawal.status}
          />
        </div>

        <div
          className="my-4 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        <div className="flex items-center justify-between gap-4">
          <span
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            Reference
          </span>
          <div className="flex items-center gap-1">
            <span
              className="max-w-[180px] truncate text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              {withdrawal.id}
            </span>
            <CopyButton
              value={withdrawal.id}
              successMessage="Withdrawal reference copied."
            />
          </div>
        </div>
      </div>

      <Button
        className="mt-5 w-full"
        onClick={onView}
      >
        View withdrawal
      </Button>

      <Button
        className="mt-2 w-full"
        variant="secondary"
        onClick={onDone}
      >
        Back to dashboard
      </Button>
    </div>
  );
}
