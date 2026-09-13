import { useMemo } from "react";

import ErrorState from "@/components/common/ErrorState";
import PullToRefresh from "@/components/common/PullToRefresh";
import AccountDetailsCard from "@/components/dashboard/AccountDetailsCard";
import AccountOverviewCard from "@/components/dashboard/AccountOverviewCard";
import AccountStatusAlert from "@/components/dashboard/AccountStatusAlert";
import BalanceCard from "@/components/dashboard/BalanceCard";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import {
  useAccountSummary,
  useDashboardUser,
  useRecentActivity,
} from "@/hooks/useDashboard";

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const userQuery = useDashboardUser();
  const accountQuery = useAccountSummary();
  const activityQuery = useRecentActivity(5);

  const displayName = useMemo(() => {
    const firstName = userQuery.data?.first_name?.trim();
    return firstName || "there";
  }, [userQuery.data?.first_name]);

  async function refreshDashboard() {
    await Promise.all([
      userQuery.refetch(),
      accountQuery.refetch(),
      activityQuery.refetch(),
    ]);
  }

  if (
    (!userQuery.data && userQuery.isPending) ||
    (!accountQuery.data && accountQuery.isPending)
  ) {
    return <DashboardSkeleton />;
  }

  if (
    (!userQuery.data && userQuery.isError) ||
    (!accountQuery.data && accountQuery.isError)
  ) {
    return (
      <ErrorState
        title="We couldn't load your account"
        description="Your account information is temporarily unavailable."
        actionLabel="Try again"
        onAction={() => {
          void refreshDashboard();
        }}
      />
    );
  }

  const account = accountQuery.data;

  if (!account) {
    return (
      <ErrorState
        title="Account unavailable"
        description="We couldn't find the account information needed for this dashboard."
        actionLabel="Try again"
        onAction={() => {
          void refreshDashboard();
        }}
      />
    );
  }

  const accountRestricted = account.status !== "active";

  return (
    <PullToRefresh
      onRefresh={refreshDashboard}
      disabled={accountQuery.isFetching && !accountQuery.data}
    >
      <div className="space-y-6 lg:space-y-7">
        <header>
          <h1
            className="
              text-2xl font-semibold tracking-[-0.03em]
              sm:text-3xl
            "
            style={{ color: "var(--text)" }}
          >
            {greeting()}, {displayName}
          </h1>
          <p
            className="mt-1 text-sm sm:text-base"
            style={{ color: "var(--muted)" }}
          >
            Here's your account today.
          </p>
        </header>

        <AccountStatusAlert status={account.status} />

        <BalanceCard
          availableBalance={account.available_balance}
          heldBalance={account.held_balance}
          currency={account.currency}
          status={account.status}
          isRefreshing={accountQuery.isFetching}
          onRefresh={() => accountQuery.refetch()}
        />

        <QuickActions disabled={accountRestricted} />

        <div className="grid gap-4 md:grid-cols-2">
          <AccountDetailsCard
            accountNumber={account.account_number}
            currency={account.currency}
            status={account.status}
          />

          <AccountOverviewCard
            availableBalance={account.available_balance}
            heldBalance={account.held_balance}
            currency={account.currency}
            status={account.status}
          />
        </div>

        <RecentActivity
          items={activityQuery.data}
          isLoading={activityQuery.isPending}
          isError={activityQuery.isError}
          onRetry={() => {
            void activityQuery.refetch();
          }}
        />
      </div>
    </PullToRefresh>
  );
}
