import { EmptyState, PageHeader } from "@/components/common";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="Review credits, debits, transfers, withdrawals, and payments." />
      <EmptyState
        title="Coming next"
        description="Your transaction history will appear here."
      />
    </div>
  );
}
