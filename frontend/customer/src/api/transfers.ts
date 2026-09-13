import { apiClient } from "@/api/client";
import type {
  AccountLookup,
  StepUpResponse,
  TransferDraft,
  TransferResponse,
} from "@/types/transfers";

export async function lookupAccount(
  accountNumber: string,
): Promise<AccountLookup> {
  const { data } = await apiClient.get<AccountLookup>(
    `/accounts/lookup/${encodeURIComponent(accountNumber)}`,
  );
  return data;
}

export async function createTransfer(
  payload: TransferDraft,
  idempotencyKey: string,
  stepUpAuthorization?: string,
): Promise<TransferResponse> {
  const { data } = await apiClient.post<TransferResponse>(
    "/transfers",
    {
      recipient_account_number:
        payload.recipient_account_number,
      amount: payload.amount,
      narration: payload.narration.trim() || null,
    },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
        ...(stepUpAuthorization
          ? {
              "X-Step-Up-Authorization":
                stepUpAuthorization,
            }
          : {}),
      },
    },
  );
  return data;
}

export async function authorizeTransfer(
  code: string,
): Promise<StepUpResponse> {
  const { data } = await apiClient.post<StepUpResponse>(
    "/auth/2fa/authorize",
    {
      code,
      scope: "transfer:create",
    },
  );
  return data;
}
