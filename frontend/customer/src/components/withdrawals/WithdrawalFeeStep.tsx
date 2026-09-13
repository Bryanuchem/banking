import {
  ArrowLeft,
  CreditCard,
  Landmark,
  WalletCards,
} from "lucide-react";

import { Button, ErrorState } from "@/components/common";
import type {
  PaymentProviderName,
  Withdrawal,
} from "@/types/withdrawals";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  paymentProviderDescription,
  paymentProviderLabel,
} from "@/utils/withdrawal";

type Props = {
  withdrawal: Withdrawal;
  providers: PaymentProviderName[];
  selectedProvider: PaymentProviderName | null;
  loadingProviders: boolean;
  submitting: boolean;
  error?: string;
  onProviderChange: (provider: PaymentProviderName) => void;
  onContinue: () => void;
  onBack: () => void;
  onCancelWithdrawal: () => void;
};

function ProviderIcon({
  provider,
}: {
  provider: PaymentProviderName;
}) {
  if (provider === "paypal") {
    return <WalletCards size={20} />;
  }

  if (provider === "paystack") {
    return <Landmark size={20} />;
  }

  return <CreditCard size={20} />;
}

export default function WithdrawalFeeStep({
  withdrawal,
  providers,
  selectedProvider,
  loadingProviders,
  submitting,
  error,
  onProviderChange,
  onContinue,
  onBack,
  onCancelWithdrawal,
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
        Back
      </button>

      <h1
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{ color: "var(--text)" }}
      >
        Withdrawal fee
      </h1>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Pay the processing fee to submit your withdrawal for review.
      </p>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5 sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="space-y-3">
          <div className="flex justify-between gap-4">
            <span
              className="text-sm"
              style={{ color: "var(--muted)" }}
            >
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
            <span
              className="text-sm"
              style={{ color: "var(--muted)" }}
            >
              Processing fee
            </span>
            <strong style={{ color: "var(--text)" }}>
              {formatCurrency(
                withdrawal.fee_amount,
                withdrawal.currency,
              )}
            </strong>
          </div>
        </div>

        <div
          className="my-5 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        <p
          className="text-sm font-medium"
          style={{ color: "var(--text)" }}
        >
          Choose payment method
        </p>

        {loadingProviders ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl"
                style={{ background: "var(--surface-alt)" }}
              />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="mt-4">
            <ErrorState
              title="No payment method available"
              description="A processing-fee provider has not been configured yet."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {providers.map((provider) => {
              const active = provider === selectedProvider;

              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => onProviderChange(provider)}
                  className="
                    flex w-full items-center gap-3 rounded-xl border
                    p-3 text-left transition
                  "
                  style={{
                    borderColor: active
                      ? "var(--brand-accent)"
                      : "var(--border)",
                    background: active
                      ? "color-mix(in srgb, var(--brand-accent) 8%, var(--surface))"
                      : "var(--surface)",
                  }}
                >
                  <div
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{
                      color: active
                        ? "var(--brand-accent)"
                        : "var(--muted)",
                      background: "var(--surface-alt)",
                    }}
                  >
                    <ProviderIcon provider={provider} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {paymentProviderLabel(provider)}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {paymentProviderDescription(provider)}
                    </p>
                  </div>

                  <span
                    className="grid size-5 place-items-center rounded-full border"
                    style={{
                      borderColor: active
                        ? "var(--brand-accent)"
                        : "var(--border)",
                    }}
                  >
                    {active ? (
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          background: "var(--brand-accent)",
                        }}
                      />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error ? (
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--danger)" }}
          >
            {error}
          </p>
        ) : null}

        <Button
          className="mt-5 w-full"
          disabled={!selectedProvider || providers.length === 0}
          loading={submitting}
          loadingText="Opening payment…"
          onClick={onContinue}
        >
          Continue to payment
        </Button>

        <button
          type="button"
          disabled={submitting}
          onClick={onCancelWithdrawal}
          className="mt-4 w-full text-center text-sm"
          style={{ color: "var(--muted)" }}
        >
          Cancel withdrawal and release held funds
        </button>
      </div>
    </div>
  );
}
