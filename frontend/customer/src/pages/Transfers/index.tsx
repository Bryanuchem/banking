import { EmptyState, PageHeader } from "@/components/common";

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Transfer" description="Send money to another account." />
      <EmptyState
        title="Coming next"
        description="Transfer flow comes in Pass 4."
      />
    </div>
  );
}
