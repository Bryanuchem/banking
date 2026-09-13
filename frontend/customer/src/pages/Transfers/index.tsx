import axios from "axios";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

import {
  Button,
  FormField,
  Input,
  Textarea,
} from "@/components/common";
import PullToRefresh from "@/components/common/PullToRefresh";
import AccountContextCard from "@/components/transfers/AccountContextCard";
import RecipientCard from "@/components/transfers/RecipientCard";
import TransferFailure from "@/components/transfers/TransferFailure";
import TransferReceipt from "@/components/transfers/TransferReceipt";
import TransferReview from "@/components/transfers/TransferReview";
import TransferStepUp from "@/components/transfers/TransferStepUp";
import { useAccountSummary } from "@/hooks/useDashboard";
import {
  useAuthorizeTransfer,
  useCreateTransfer,
  useRecipientLookup,
} from "@/hooks/useTransfers";
import type {
  TransferDraft,
  TransferResponse,
} from "@/types/transfers";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  getTransferErrorMessage,
  isStepUpRequired,
} from "@/utils/transferError";

type Step =
  | "form"
  | "review"
  | "verify"
  | "success"
  | "failure";

export default function TransfersPage() {
  const navigate = useNavigate();
  const accountQ = useAccountSummary();
  const transferM = useCreateTransfer();
  const authorizeM = useAuthorizeTransfer();

  const [step, setStep] = useState<Step>("form");
  const [accountNumber, setAccountNumber] = useState("");
  const [debounced, setDebounced] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [formError, setFormError] = useState("");
  const [failure, setFailure] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [key, setKey] = useState("");
  const [result, setResult] =
    useState<TransferResponse | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebounced(accountNumber.trim()),
      350,
    );

    return () => window.clearTimeout(timeout);
  }, [accountNumber]);

  const lookupQ = useRecipientLookup(debounced);
  const account = accountQ.data;

  const self = Boolean(
    account &&
      lookupQ.data?.account_number ===
        account.account_number,
  );

  const lookupError = lookupQ.isError
    ? axios.isAxiosError(lookupQ.error) &&
      lookupQ.error.response?.status === 404
      ? "We couldn't find that account."
      : getTransferErrorMessage(lookupQ.error)
    : "";

  const draft: TransferDraft = useMemo(
    () => ({
      recipient_account_number: accountNumber.trim(),
      amount,
      narration,
    }),
    [accountNumber, amount, narration],
  );

  async function refreshTransferContext() {
    const jobs: Promise<unknown>[] = [
      accountQ.refetch(),
    ];

    if (debounced.length >= 6) {
      jobs.push(lookupQ.refetch());
    }

    await Promise.all(jobs);
  }

  function review() {
    setFormError("");
    const numeric = Number(amount);

    if (!lookupQ.data || self) {
      setFormError(
        self
          ? "You can't send money to your own account."
          : "Enter a valid recipient account.",
      );
      return;
    }

    if (!Number.isFinite(numeric) || numeric <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    if (
      account &&
      numeric > Number(account.available_balance)
    ) {
      setFormError("Insufficient available balance.");
      return;
    }

    setKey(crypto.randomUUID());
    setStep("review");
  }

  async function submit(stepToken?: string) {
    setFailure("");

    try {
      const transfer = await transferM.mutateAsync({
        draft,
        idempotencyKey: key,
        stepUpAuthorization: stepToken,
      });
      setResult(transfer);
      setStep("success");
    } catch (error) {
      if (isStepUpRequired(error) && !stepToken) {
        setStep("verify");
        return;
      }

      setFailure(getTransferErrorMessage(error));
      setStep("failure");
    }
  }

  async function verify(code: string) {
    setVerifyError("");

    try {
      const auth = await authorizeM.mutateAsync(code);
      await submit(auth.authorization_token);
    } catch (error) {
      setVerifyError(getTransferErrorMessage(error));
    }
  }

  if (step === "review" && lookupQ.data && account) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,680px)_320px] lg:items-start">
        <TransferReview
          draft={draft}
          recipient={lookupQ.data}
          currency={account.currency}
          submitting={transferM.isPending}
          onBack={() => setStep("form")}
          onConfirm={() => void submit()}
        />

        <div className="hidden lg:block">
          <AccountContextCard account={account} />
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <TransferStepUp
        submitting={
          authorizeM.isPending || transferM.isPending
        }
        error={verifyError}
        onVerify={(code) => void verify(code)}
        onCancel={() => setStep("review")}
      />
    );
  }

  if (step === "success" && result) {
    return (
      <TransferReceipt
        transfer={result}
        onDone={() => navigate(ROUTES.dashboard)}
      />
    );
  }

  if (step === "failure") {
    return (
      <TransferFailure
        message={failure}
        onRetry={() => void submit()}
        onEdit={() => setStep("form")}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={refreshTransferContext}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,680px)_320px] lg:items-start">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
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
            Send money
          </h1>

          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Send money securely to another account.
          </p>

          <div
            className="
              mt-6 rounded-[var(--radius-card)] border
              p-4 sm:p-6
            "
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="space-y-5">
              <FormField
                label="Recipient"
                htmlFor="recipient"
                error={
                  self
                    ? "You can't send money to your own account."
                    : lookupError || undefined
                }
              >
                <Input
                  id="recipient"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(
                      event.target.value.replace(/\D/g, ""),
                    );
                    setFormError("");
                  }}
                  placeholder="Enter account number"
                />
              </FormField>

              {lookupQ.isFetching &&
              debounced.length >= 6 ? (
                <div
                  className="
                    flex items-center gap-2 rounded-xl
                    border p-3 text-sm
                  "
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                  Checking account…
                </div>
              ) : lookupQ.data && !self ? (
                <RecipientCard recipient={lookupQ.data} />
              ) : null}

              <FormField label="Amount" htmlFor="amount">
                <Input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setFormError("");
                  }}
                  placeholder="0.00"
                />
              </FormField>

              {account ? (
                <div className="text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    Available balance{" "}
                  </span>
                  <strong
                    style={{ color: "var(--success)" }}
                  >
                    {formatCurrency(
                      account.available_balance,
                      account.currency,
                    )}
                  </strong>
                </div>
              ) : null}

              <FormField
                label="Note"
                htmlFor="note"
                optional
              >
                <Textarea
                  id="note"
                  rows={3}
                  maxLength={255}
                  value={narration}
                  onChange={(event) =>
                    setNarration(event.target.value)
                  }
                  placeholder="What is this transfer for?"
                />
              </FormField>

              {formError ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--danger)" }}
                >
                  {formError}
                </p>
              ) : null}

              <Button
                className="w-full"
                onClick={review}
                disabled={
                  !lookupQ.data ||
                  self ||
                  lookupQ.isFetching ||
                  !amount
                }
              >
                Continue
              </Button>
            </div>
          </div>
        </div>

        {account ? (
          <div className="hidden lg:block">
            <AccountContextCard account={account} />
          </div>
        ) : null}
      </div>
    </PullToRefresh>
  );
}
