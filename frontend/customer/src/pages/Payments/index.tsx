import { EmptyState, PageHeader } from "@/components/common";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Review and complete payment-provider activity." />
      <EmptyState
        title="Coming next"
        description="Payment activity will appear here."
      />
    </div>
  );
}
