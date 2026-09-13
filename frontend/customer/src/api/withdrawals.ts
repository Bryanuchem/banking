import { apiClient } from "@/api/client";
import type {
  PaymentCheckout,
  PaymentProviderName,
  PaymentStatus,
  StepUpAuthorization,
  Withdrawal,
  WithdrawalDraft,
  WithdrawalQuote,
} from "@/types/withdrawals";

export async function getWithdrawalQuote(
  amount: string,
): Promise<WithdrawalQuote> {
  const { data } = await apiClient.get<WithdrawalQuote>(
    "/withdrawals/quote",
    { params: { amount } },
  );
  return data;
}

export async function createWithdrawal(
  draft: WithdrawalDraft,
  idempotencyKey: string,
): Promise<Withdrawal> {
  const { data } = await apiClient.post<Withdrawal>(
    "/withdrawals",
    draft,
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );
  return data;
}

export async function getWithdrawals(
  limit = 50,
  offset = 0,
): Promise<Withdrawal[]> {
  const { data } = await apiClient.get<Withdrawal[]>(
    "/withdrawals",
    { params: { limit, offset } },
  );
  return data;
}

export async function getWithdrawal(
  withdrawalId: string,
): Promise<Withdrawal> {
  const { data } = await apiClient.get<Withdrawal>(
    `/withdrawals/${withdrawalId}`,
  );
  return data;
}

export async function cancelWithdrawal(
  withdrawalId: string,
): Promise<Withdrawal> {
  const { data } = await apiClient.post<Withdrawal>(
    `/withdrawals/${withdrawalId}/cancel`,
  );
  return data;
}

export async function getPaymentProviders(): Promise<
  PaymentProviderName[]
> {
  const { data } = await apiClient.get<PaymentProviderName[]>(
    "/payments/providers",
  );
  return data;
}

export async function initializeWithdrawalFee(
  withdrawalId: string,
  provider: PaymentProviderName,
  stepUpAuthorization?: string,
): Promise<PaymentCheckout> {
  const { data } = await apiClient.post<PaymentCheckout>(
    `/withdrawals/${withdrawalId}/fee-payment`,
    null,
    {
      params: { provider },
      headers: stepUpAuthorization
        ? {
            "X-Step-Up-Authorization":
              stepUpAuthorization,
          }
        : undefined,
    },
  );
  return data;
}

export async function verifyPayment(
  reference: string,
): Promise<PaymentStatus> {
  const { data } = await apiClient.get<PaymentStatus>(
    `/payments/${encodeURIComponent(reference)}/verify`,
  );
  return data;
}

export async function authorizeWithdrawalFee(
  code: string,
): Promise<StepUpAuthorization> {
  const { data } =
    await apiClient.post<StepUpAuthorization>(
      "/auth/2fa/authorize",
      {
        code,
        scope: "payment:create",
      },
    );
  return data;
}

export async function completeCashAppApproval(
  paymentId: string,
  grantId: string,
): Promise<PaymentStatus> {
  const { data } = await apiClient.post<PaymentStatus>(
    `/payments/${paymentId}/client-approval`,
    { grant_id: grantId },
  );
  return data;
}
