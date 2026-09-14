import { apiClient } from "@/api/client";

export type AccountDeletionStatus = {
  account_number: string;
  currency: string;
  available_balance: string;
  held_balance: string;
  pending_withdrawals: number;
  pending_deposits: number;
  can_delete: boolean;
  clear_route: string | null;
};

export type AccountDeletionResult = {
  account_id: string;
  account_number: string;
  deleted_at: string;
  user_deactivated: boolean;
  history_preserved: boolean;
};

export async function getAccountDeletionStatus() {
  return (
    await apiClient.get<AccountDeletionStatus>(
      "/account/deletion-status",
    )
  ).data;
}

export async function authorizeAccountDeletion(
  code: string,
): Promise<{
  authorization_token: string;
  scope: string;
}> {
  return (
    await apiClient.post("/auth/2fa/authorize", {
      code,
      scope: "account:delete",
    })
  ).data;
}

export async function deleteCustomerAccount(
  payload: {
    confirmation: string;
    reason?: string | null;
  },
  stepUpAuthorization?: string,
) {
  return (
    await apiClient.delete<AccountDeletionResult>(
      "/account",
      {
        data: payload,
        headers: stepUpAuthorization
          ? {
              "X-Step-Up-Authorization":
                stepUpAuthorization,
            }
          : undefined,
      },
    )
  ).data;
}
