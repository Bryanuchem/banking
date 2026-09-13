import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import {
  getTransaction,
  getTransactions,
} from "@/api/transactions";
import type { TransactionFilters } from "@/types/transactions";

const PAGE_SIZE = 20;

export function useTransactions(
  filters: TransactionFilters,
) {
  return useInfiniteQuery({
    queryKey: ["transactions", filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getTransactions({
        limit: PAGE_SIZE,
        offset: pageParam,
        filters,
      }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE
        ? pages.length * PAGE_SIZE
        : undefined,
  });
}

export function useTransactionDetail(
  transactionId: string | null,
) {
  return useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => getTransaction(transactionId!),
    enabled: Boolean(transactionId),
  });
}
