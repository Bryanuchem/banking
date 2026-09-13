import { EmptyState, PageHeader } from "@/components/common";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile & security" description="Manage your personal information and security." />
      <EmptyState
        title="Coming next"
        description="Profile and security controls come in Pass 7."
      />
    </div>
  );
}
