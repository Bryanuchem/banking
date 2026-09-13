import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button, ErrorState, PageHeader } from "@/components/common";
import PullToRefresh from "@/components/common/PullToRefresh";
import ActivityFilters from "@/components/transactions/ActivityFilters";
import TransactionDetailPanel from "@/components/transactions/TransactionDetailPanel";
import TransactionList from "@/components/transactions/TransactionList";
import {
  useTransactionDetail,
  useTransactions,
} from "@/hooks/useTransactions";
import type {
  TransactionFilters,
  TransactionItem,
} from "@/types/transactions";

export default function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] =
    useState<TransactionFilters>({});

  const selectedId = params.get("transaction");
  const txQ = useTransactions(filters);
  const detailQ = useTransactionDetail(selectedId);

  const items = useMemo(
    () => txQ.data?.pages.flat() ?? [],
    [txQ.data],
  );

  useEffect(() => {
    if (
      selectedId &&
      items.some((item) => item.id === selectedId)
    ) {
      return;
    }
  }, [selectedId, items]);

  function select(item: TransactionItem) {
    const next = new URLSearchParams(params);
    next.set("transaction", item.id);
    setParams(next);
  }

  function close() {
    const next = new URLSearchParams(params);
    next.delete("transaction");
    setParams(next, { replace: true });
  }

  async function refreshActivity() {
    const jobs: Promise<unknown>[] = [
      txQ.refetch(),
    ];

    if (selectedId) {
      jobs.push(detailQ.refetch());
    }

    await Promise.all(jobs);
  }

  return (
    <PullToRefresh onRefresh={refreshActivity}>
      <div className="space-y-5">
        <PageHeader
          title="Activity"
          description="Track money in, money out, and every account transaction."
        />

        <ActivityFilters
          filters={filters}
          onChange={setFilters}
        />

        {txQ.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl"
                style={{ background: "var(--surface-alt)" }}
              />
            ))}
          </div>
        ) : txQ.isError ? (
          <ErrorState
            title="Could not load activity"
            description="Your transaction history is temporarily unavailable."
            onAction={() => void txQ.refetch()}
          />
        ) : (
          <>
            <TransactionList
              items={items}
              onSelect={select}
            />

            {txQ.hasNextPage ? (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  loading={txQ.isFetchingNextPage}
                  loadingText="Loading…"
                  onClick={() => void txQ.fetchNextPage()}
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}

        {selectedId ? (
          <TransactionDetailPanel
            item={detailQ.data}
            loading={detailQ.isPending}
            error={detailQ.isError}
            onClose={close}
            onRetry={() => void detailQ.refetch()}
          />
        ) : null}
      </div>
    </PullToRefresh>
  );
}
