import { Card, EmptyState, PageHeader } from "@/components/common";

export default function ForgotPasswordPage() {
  return (
    <Card>
      <div className="space-y-6">
        <PageHeader
          title="Forgot password"
          description="Password recovery will use the shared form and state patterns."
        />
        <EmptyState
          title="Foundation ready"
          description="The reusable UI contract is in place. This flow is implemented in the authentication pass."
        />
      </div>
    </Card>
  );
}
