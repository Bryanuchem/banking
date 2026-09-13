import {
  Card,
  EmptyState,
  MoneyDisplay,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/common";
import { useBranding } from "@/context/BrandingContext";

export default function DashboardPage() {
  const { config } = useBranding();
  const currency = config?.primary_currency ?? "USD";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account overview"
        title="Good to see you"
        description="Your customer dashboard foundation is ready. Live account data comes in the dashboard pass."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--muted)" }}
          >
            Available balance
          </p>
          <div className="mt-3">
            <MoneyDisplay value={0} currency={currency} size="xl" />
          </div>
          <div className="mt-4">
            <StatusBadge tone="success">Account active</StatusBadge>
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Held balance"
            description="Funds temporarily reserved by an active operation."
          />
          <div className="mt-5">
            <MoneyDisplay
              value={0}
              currency={currency}
              size="lg"
              muted
            />
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Recent activity"
          description="Transactions will use this shared empty-state pattern."
        />
        <EmptyState
          title="No activity yet"
          description="Your most recent transactions will appear here once the account has activity."
        />
      </section>
    </div>
  );
}
