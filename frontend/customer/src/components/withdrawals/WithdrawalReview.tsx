import { ArrowLeft, Landmark } from "lucide-react";

import { Button } from "@/components/common";
import type {
  WithdrawalDraft,
  WithdrawalQuote,
} from "@/types/withdrawals";
import { formatCurrency } from "@/utils/formatCurrency";

type Props = {
  draft: WithdrawalDraft;
  quote: WithdrawalQuote;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className="text-sm"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <span
        className={strong ? "font-semibold" : "text-sm"}
        style={{ color: "var(--text)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function WithdrawalReview({
  draft,
  quote,
  submitting,
  onBack,
  onConfirm,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="mb-5 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={17} />
        Edit withdrawal
      </button>

      <h1
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{ color: "var(--text)" }}
      >
        Review withdrawal
      </h1>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Confirm the details before proceeding to the fee payment.
      </p>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5 sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="space-y-4">
          <Row
            label="Withdrawal amount"
            value={formatCurrency(
              quote.amount,
              quote.currency,
            )}
            strong
          />
          <Row
            label="Processing fee"
            value={formatCurrency(
              quote.fee_amount,
              quote.currency,
            )}
          />
          <div
            className="border-t pt-4"
            style={{ borderColor: "var(--border)" }}
          >
            <Row
              label="Recipient receives"
              value={formatCurrency(
                quote.recipient_receives,
                quote.currency,
              )}
              strong
            />
          </div>
        </div>

        <div
          className="my-5 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        <p
          className="text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: "var(--muted)" }}
        >
          Destination
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{
              color: "var(--brand-accent)",
              background: "var(--surface-alt)",
            }}
          >
            <Landmark size={19} />
          </div>
          <div className="min-w-0">
            <p
              className="font-medium"
              style={{ color: "var(--text)" }}
            >
              {draft.destination_bank_name}
            </p>
            <p
              className="mt-0.5 text-sm"
              style={{ color: "var(--muted)" }}
            >
              {draft.destination_account_name} · ••••{" "}
              {draft.destination_account_number.slice(-4)}
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-xl border p-4 text-sm leading-6"
          style={{
            color: "var(--text)",
            background:
              "color-mix(in srgb, var(--brand-accent) 8%, var(--surface))",
            borderColor:
              "color-mix(in srgb, var(--brand-accent) 22%, var(--border))",
          }}
        >
          The withdrawal amount will move from your available balance to
          held balance while the request is processed. The processing fee
          is paid separately and does not reduce the amount sent to your
          destination.
        </div>

        <Button
          className="mt-6 w-full"
          loading={submitting}
          loadingText="Preparing fee payment…"
          onClick={onConfirm}
        >
          Confirm withdrawal
        </Button>
      </div>
    </div>
  );
}
