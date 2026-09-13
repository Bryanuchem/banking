import { apiClient } from "@/api/client";
import type {
  TransactionFilters,
  TransactionItem,
} from "@/types/transactions";

export async function getTransactions({
  limit = 20,
  offset = 0,
  filters = {},
}: {
  limit?: number;
  offset?: number;
  filters?: TransactionFilters;
} = {}): Promise<TransactionItem[]> {
  const { data } = await apiClient.get<TransactionItem[]>(
    "/transactions",
    {
      params: {
        limit,
        offset,
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        direction: filters.direction || undefined,
      },
    },
  );
  return data;
}

export async function getTransaction(
  transactionId: string,
): Promise<TransactionItem> {
  const { data } = await apiClient.get<TransactionItem>(
    `/transactions/${transactionId}`,
  );
  return data;
}
