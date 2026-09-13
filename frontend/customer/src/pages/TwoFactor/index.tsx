import { Card, EmptyState, PageHeader } from "@/components/common";

export default function TwoFactorPage() {
  return (
    <Card>
      <div className="space-y-6">
        <PageHeader
          title="Two-factor verification"
          description="The 2FA challenge will be wired in Pass 2."
        />
        <EmptyState
          title="Foundation ready"
          description="The reusable UI contract is in place. This flow is implemented in the authentication pass."
        />
      </div>
    </Card>
  );
}
