import { Landmark, Plus } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

import {
  Button,
  ErrorState,
  FormField,
  Input,
  PageHeader,
} from "@/components/common";
import PullToRefresh from "@/components/common/PullToRefresh";
import {
  CashAppPayKit,
  WithdrawalDetails,
  WithdrawalFeeStep,
  WithdrawalList,
  WithdrawalReview,
  WithdrawalStepUp,
  WithdrawalSubmitted,
} from "@/components/withdrawals";
import { useAccountSummary } from "@/hooks/useDashboard";
import {
  useAuthorizeWithdrawalFee,
  useCancelWithdrawal,
  useCompleteCashAppApproval,
  useCreateWithdrawal,
  useInitializeWithdrawalFee,
  usePaymentProviders,
  useVerifyWithdrawalFee,
  useWithdrawalDetail,
  useWithdrawalQuote,
  useWithdrawals,
} from "@/hooks/useWithdrawals";
import type {
  PaymentCheckout,
  PaymentProviderName,
  Withdrawal,
  WithdrawalDraft,
} from "@/types/withdrawals";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  requiresStepUp,
  withdrawalErrorMessage,
} from "@/utils/withdrawal";

type Screen =
  | "home"
  | "form"
  | "review"
  | "fee"
  | "verify"
  | "cashapp"
  | "waiting-payment"
  | "submitted"
  | "details";

const emptyDraft: WithdrawalDraft = {
  amount: "",
  destination_bank_name: "",
  destination_account_number: "",
  destination_account_name: "",
};

export default function WithdrawalsPage() {
  const navigate = useNavigate();
  const accountQ = useAccountSummary();
  const withdrawalsQ = useWithdrawals();
  const providersQ = usePaymentProviders();

  const createM = useCreateWithdrawal();
  const feeM = useInitializeWithdrawalFee();
  const authorizeM = useAuthorizeWithdrawalFee();
  const verifyM = useVerifyWithdrawalFee();
  const cancelM = useCancelWithdrawal();
  const cashAppM = useCompleteCashAppApproval();

  const [screen, setScreen] = useState<Screen>("home");
  const [draft, setDraft] =
    useState<WithdrawalDraft>(emptyDraft);
  const quoteQ = useWithdrawalQuote(draft.amount);

  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const detailQ = useWithdrawalDetail(
    screen === "details" && selectedWithdrawal
      ? selectedWithdrawal.id
      : null,
  );

  const [provider, setProvider] =
    useState<PaymentProviderName | null>(null);
  const [checkout, setCheckout] =
    useState<PaymentCheckout | null>(null);
  const [error, setError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [idempotencyKey, setIdempotencyKey] =
    useState("");

  const account = accountQ.data;
  const quote = quoteQ.data;
  const withdrawals = withdrawalsQ.data ?? [];
  const activeDetail =
    detailQ.data ?? selectedWithdrawal;

  useEffect(() => {
    if (!provider && providersQ.data?.length) {
      setProvider(providersQ.data[0]);
    }
  }, [provider, providersQ.data]);

  const amountValid = useMemo(() => {
    const numeric = Number(draft.amount);
    return (
      Number.isFinite(numeric) &&
      numeric > 0 &&
      (!account ||
        numeric <= Number(account.available_balance))
    );
  }, [draft.amount, account]);

  async function refreshPage() {
    await Promise.all([
      accountQ.refetch(),
      withdrawalsQ.refetch(),
      screen === "details" && selectedWithdrawal
        ? detailQ.refetch()
        : Promise.resolve(),
    ]);
  }

  function startNew() {
    setDraft(emptyDraft);
    setSelectedWithdrawal(null);
    setCheckout(null);
    setError("");
    setVerifyError("");
    setIdempotencyKey(crypto.randomUUID());
    setScreen("form");
  }

  function updateDraft(
    key: keyof WithdrawalDraft,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
  }

  function reviewWithdrawal() {
    setError("");

    if (!amountValid) {
      setError(
        account &&
          Number(draft.amount) >
            Number(account.available_balance)
          ? "Insufficient available balance."
          : "Enter a valid withdrawal amount.",
      );
      return;
    }

    if (
      !draft.destination_bank_name.trim() ||
      !draft.destination_account_name.trim() ||
      !draft.destination_account_number.trim()
    ) {
      setError("Complete the destination details.");
      return;
    }

    if (!quote) {
      setError(
        quoteQ.isError
          ? withdrawalErrorMessage(quoteQ.error)
          : "We're still calculating the processing fee.",
      );
      return;
    }

    if (!idempotencyKey) {
      setIdempotencyKey(crypto.randomUUID());
    }

    setScreen("review");
  }

  async function confirmWithdrawal() {
    setError("");

    try {
      const created = await createM.mutateAsync({
        draft: {
          ...draft,
          destination_bank_name:
            draft.destination_bank_name.trim(),
          destination_account_number:
            draft.destination_account_number.trim(),
          destination_account_name:
            draft.destination_account_name.trim(),
        },
        idempotencyKey:
          idempotencyKey || crypto.randomUUID(),
      });

      setSelectedWithdrawal(created);

      if (
        created.status === "awaiting_fee" &&
        Number(created.fee_amount) > 0
      ) {
        setScreen("fee");
      } else {
        setScreen("submitted");
      }
    } catch (requestError) {
      setError(
        withdrawalErrorMessage(requestError),
      );
    }
  }

  async function initializeFee(
    stepUpAuthorization?: string,
  ) {
    if (!selectedWithdrawal || !provider) return;

    setError("");

    try {
      const payment = await feeM.mutateAsync({
        withdrawalId: selectedWithdrawal.id,
        provider,
        stepUpAuthorization,
      });

      setCheckout(payment);

      if (payment.authorization_url) {
        window.open(
          payment.authorization_url,
          "_blank",
          "noopener,noreferrer",
        );
        setScreen("waiting-payment");
        return;
      }

      if (
        payment.provider === "cashapp" &&
        payment.checkout_data?.flow === "paykit"
      ) {
        setScreen("cashapp");
        return;
      }

      setError(
        "The payment provider did not return a checkout URL.",
      );
    } catch (requestError) {
      if (
        requiresStepUp(requestError) &&
        !stepUpAuthorization
      ) {
        setScreen("verify");
        return;
      }

      setError(
        withdrawalErrorMessage(requestError),
      );
    }
  }

  async function verifyStepUp(code: string) {
    setVerifyError("");

    try {
      const authorization =
        await authorizeM.mutateAsync(code);

      await initializeFee(
        authorization.authorization_token,
      );
    } catch (requestError) {
      setVerifyError(
        withdrawalErrorMessage(requestError),
      );
    }
  }

  async function verifyFeePayment() {
    if (!checkout || !selectedWithdrawal) return;

    setError("");

    try {
      const payment = await verifyM.mutateAsync(
        checkout.reference,
      );

      if (payment.status === "paid") {
        const refreshed =
          await detailQ.refetch().catch(() => null);

        const nextWithdrawal =
          refreshed?.data ??
          ({
            ...selectedWithdrawal,
            status: "pending_review",
          } satisfies Withdrawal);

        setSelectedWithdrawal(nextWithdrawal);
        setScreen("submitted");
        await refreshPage();
        return;
      }

      setError(
        "The provider has not confirmed the fee payment yet. If you just paid, wait a moment and try again.",
      );
    } catch (requestError) {
      setError(
        withdrawalErrorMessage(requestError),
      );
    }
  }

  async function completeCashApp(
    grantId: string,
  ) {
    if (!checkout || !selectedWithdrawal) return;

    setError("");

    try {
      const payment =
        await cashAppM.mutateAsync({
          paymentId: checkout.id,
          grantId,
        });

      if (payment.status !== "paid") {
        setError(
          "Cash App has not confirmed the fee payment yet.",
        );
        return;
      }

      const nextWithdrawal = {
        ...selectedWithdrawal,
        status: "pending_review",
      } satisfies Withdrawal;

      setSelectedWithdrawal(nextWithdrawal);
      setScreen("submitted");
      await refreshPage();
    } catch (requestError) {
      setError(
        withdrawalErrorMessage(requestError),
      );
    }
  }

  async function cancelSelected() {
    if (!selectedWithdrawal) return;

    setError("");

    try {
      const cancelled =
        await cancelM.mutateAsync(
          selectedWithdrawal.id,
        );
      setSelectedWithdrawal(cancelled);
      setScreen("details");
    } catch (requestError) {
      setError(
        withdrawalErrorMessage(requestError),
      );
    }
  }

  if (screen === "review" && quote) {
    return (
      <WithdrawalReview
        draft={draft}
        quote={quote}
        submitting={createM.isPending}
        onBack={() => setScreen("form")}
        onConfirm={() => void confirmWithdrawal()}
      />
    );
  }

  if (
    screen === "fee" &&
    selectedWithdrawal
  ) {
    return (
      <WithdrawalFeeStep
        withdrawal={selectedWithdrawal}
        providers={providersQ.data ?? []}
        selectedProvider={provider}
        loadingProviders={providersQ.isPending}
        submitting={feeM.isPending}
        error={error}
        onProviderChange={(value) => {
          setProvider(value);
          setError("");
        }}
        onContinue={() => void initializeFee()}
        onBack={() => setScreen("submitted")}
        onCancelWithdrawal={() =>
          void cancelSelected()
        }
      />
    );
  }

  if (screen === "verify") {
    return (
      <WithdrawalStepUp
        submitting={
          authorizeM.isPending || feeM.isPending
        }
        error={verifyError}
        onVerify={(code) =>
          void verifyStepUp(code)
        }
        onCancel={() => setScreen("fee")}
      />
    );
  }

  if (
    screen === "cashapp" &&
    checkout
  ) {
    return (
      <CashAppPayKit
        checkout={checkout}
        submitting={cashAppM.isPending}
        error={error}
        onApproved={(grantId) =>
          void completeCashApp(grantId)
        }
        onCancel={() => setScreen("fee")}
      />
    );
  }

  if (
    screen === "waiting-payment" &&
    checkout &&
    selectedWithdrawal
  ) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div
          className="mx-auto grid size-14 place-items-center rounded-2xl"
          style={{
            color: "var(--brand-accent)",
            background:
              "color-mix(in srgb, var(--brand-accent) 10%, var(--surface))",
          }}
        >
          <Landmark size={25} />
        </div>

        <h1
          className="mt-4 text-2xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          Complete the fee payment
        </h1>
        <p
          className="mx-auto mt-2 max-w-md text-sm leading-6"
          style={{ color: "var(--muted)" }}
        >
          We opened the secure provider checkout in a new tab. Complete the
          {` ${formatCurrency(
            selectedWithdrawal.fee_amount,
            selectedWithdrawal.currency,
          )} `}
          processing-fee payment there, then return here to verify it.
        </p>

        <div
          className="mt-6 rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <Button
            className="w-full"
            loading={verifyM.isPending}
            loadingText="Checking payment…"
            onClick={() => void verifyFeePayment()}
          >
            I've paid · Verify payment
          </Button>

          {checkout.authorization_url ? (
            <Button
              className="mt-2 w-full"
              variant="secondary"
              onClick={() =>
                window.open(
                  checkout.authorization_url,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Reopen payment
            </Button>
          ) : null}

          {error ? (
            <p
              className="mt-4 text-sm"
              style={{ color: "var(--danger)" }}
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (
    screen === "submitted" &&
    selectedWithdrawal
  ) {
    return (
      <WithdrawalSubmitted
        withdrawal={selectedWithdrawal}
        onView={() => setScreen("details")}
        onDone={() => navigate(ROUTES.dashboard)}
      />
    );
  }

  if (
    screen === "details" &&
    activeDetail
  ) {
    return (
      <WithdrawalDetails
        withdrawal={activeDetail}
        cancelling={cancelM.isPending}
        onBack={() => setScreen("home")}
        onPayFee={() => {
          setSelectedWithdrawal(activeDetail);
          setScreen("fee");
        }}
        onCancel={() => void cancelSelected()}
      />
    );
  }

  if (screen === "form") {
    return (
      <PullToRefresh onRefresh={refreshPage}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,680px)_320px] lg:items-start">
          <div>
            <PageHeader
              title="Withdraw"
              description="Move funds to your bank account or another approved destination."
            />

            <div
              className="mt-6 rounded-[var(--radius-card)] border p-4 sm:p-6"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {account ? (
                <div
                  className="mb-5 grid grid-cols-2 gap-3 rounded-xl border p-3"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-alt)",
                  }}
                >
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      Available balance
                    </p>
                    <p
                      className="mt-1 font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {formatCurrency(
                        account.available_balance,
                        account.currency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      Held balance
                    </p>
                    <p
                      className="mt-1 font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {formatCurrency(
                        account.held_balance,
                        account.currency,
                      )}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-5">
                <FormField
                  label="Amount"
                  htmlFor="withdrawal-amount"
                >
                  <Input
                    id="withdrawal-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={draft.amount}
                    onChange={(event) =>
                      updateDraft(
                        "amount",
                        event.target.value,
                      )
                    }
                  />
                </FormField>

                {quote ? (
                  <div
                    className="rounded-xl border p-3 text-sm"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-alt)",
                    }}
                  >
                    <div className="flex justify-between gap-4">
                      <span style={{ color: "var(--muted)" }}>
                        Processing fee
                      </span>
                      <span style={{ color: "var(--text)" }}>
                        {formatCurrency(
                          quote.fee_amount,
                          quote.currency,
                        )}
                      </span>
                    </div>
                    <p
                      className="mt-2 text-xs leading-5"
                      style={{ color: "var(--muted)" }}
                    >
                      The fee is paid separately after you confirm the
                      withdrawal.
                    </p>
                  </div>
                ) : null}

                <div
                  className="border-t pt-5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="mb-4 text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Destination
                  </p>

                  <div className="space-y-4">
                    <FormField
                      label="Bank name"
                      htmlFor="withdrawal-bank"
                    >
                      <Input
                        id="withdrawal-bank"
                        value={
                          draft.destination_bank_name
                        }
                        onChange={(event) =>
                          updateDraft(
                            "destination_bank_name",
                            event.target.value,
                          )
                        }
                        placeholder="Enter bank name"
                      />
                    </FormField>

                    <FormField
                      label="Account name"
                      htmlFor="withdrawal-account-name"
                    >
                      <Input
                        id="withdrawal-account-name"
                        value={
                          draft.destination_account_name
                        }
                        onChange={(event) =>
                          updateDraft(
                            "destination_account_name",
                            event.target.value,
                          )
                        }
                        placeholder="Name on destination account"
                      />
                    </FormField>

                    <FormField
                      label="Account number"
                      htmlFor="withdrawal-account-number"
                    >
                      <Input
                        id="withdrawal-account-number"
                        inputMode="numeric"
                        value={
                          draft.destination_account_number
                        }
                        onChange={(event) =>
                          updateDraft(
                            "destination_account_number",
                            event.target.value.replace(
                              /\s/g,
                              "",
                            ),
                          )
                        }
                        placeholder="Destination account number"
                      />
                    </FormField>
                  </div>
                </div>

                {error ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--danger)" }}
                  >
                    {error}
                  </p>
                ) : null}

                <Button
                  className="w-full"
                  disabled={
                    !amountValid ||
                    quoteQ.isFetching ||
                    !draft.destination_bank_name.trim() ||
                    !draft.destination_account_name.trim() ||
                    !draft.destination_account_number.trim()
                  }
                  onClick={reviewWithdrawal}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>

          {account ? (
            <aside
              className="hidden rounded-[var(--radius-card)] border p-5 lg:block"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <h2
                className="font-semibold"
                style={{ color: "var(--text)" }}
              >
                Your account
              </h2>
              <p
                className="mt-4 text-xs"
                style={{ color: "var(--muted)" }}
              >
                Available balance
              </p>
              <p
                className="mt-1 text-xl font-semibold"
                style={{ color: "var(--text)" }}
              >
                {formatCurrency(
                  account.available_balance,
                  account.currency,
                )}
              </p>
              <p
                className="mt-4 text-xs leading-5"
                style={{ color: "var(--muted)" }}
              >
                Once confirmed, the withdrawal amount is reserved in held
                balance while the request moves through fee payment and review.
              </p>
            </aside>
          ) : null}
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshPage}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            title="Withdraw"
            description="Create a withdrawal and track its current status."
          />

          <Button
            icon={<Plus size={17} />}
            onClick={startNew}
          >
            New withdrawal
          </Button>
        </div>

        {accountQ.isError ? (
          <ErrorState
            title="Could not load your balance"
            description="Your account balance is temporarily unavailable."
            onAction={() => void accountQ.refetch()}
          />
        ) : null}

        {withdrawalsQ.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl"
                  style={{
                    background: "var(--surface-alt)",
                  }}
                />
              ),
            )}
          </div>
        ) : withdrawalsQ.isError ? (
          <ErrorState
            title="Could not load withdrawals"
            description="Your withdrawal history is temporarily unavailable."
            onAction={() =>
              void withdrawalsQ.refetch()
            }
          />
        ) : (
          <WithdrawalList
            items={withdrawals}
            onSelect={(withdrawal) => {
              setSelectedWithdrawal(withdrawal);
              setError("");
              setScreen("details");
            }}
          />
        )}
      </div>
    </PullToRefresh>
  );
}
