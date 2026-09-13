import { EmptyState, PageHeader } from "@/components/common";

export default function WithdrawalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Withdraw" description="Move funds to an approved destination." />
      <EmptyState
        title="Coming next"
        description="Withdrawal flow comes in Pass 5."
      />
    </div>
  );
}
