import { apiClient } from "@/api/client";
import type {
  AccountSummary,
  DashboardUser,
  TransactionHistoryItem,
} from "@/types/dashboard";

export async function getDashboardUser(): Promise<DashboardUser> {
  const { data } = await apiClient.get<DashboardUser>("/auth/me");
  return data;
}

export async function getAccountSummary(): Promise<AccountSummary> {
  const { data } = await apiClient.get<AccountSummary>("/account");
  return data;
}

export async function getRecentTransactions(
  limit = 5,
): Promise<TransactionHistoryItem[]> {
  const { data } = await apiClient.get<TransactionHistoryItem[]>(
    "/transactions",
    {
      params: {
        limit,
        offset: 0,
      },
    },
  );

  return data;
}
