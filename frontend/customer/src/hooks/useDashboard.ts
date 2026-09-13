import { useQuery } from "@tanstack/react-query";

import {
  getAccountSummary,
  getDashboardUser,
  getRecentTransactions,
} from "@/api/dashboard";

export const dashboardQueryKeys = {
  user: ["dashboard", "user"] as const,
  account: ["dashboard", "account"] as const,
  recentActivity: ["dashboard", "recent-activity"] as const,
};

export function useDashboardUser() {
  return useQuery({
    queryKey: dashboardQueryKeys.user,
    queryFn: getDashboardUser,
    staleTime: 60_000,
  });
}

export function useAccountSummary() {
  return useQuery({
    queryKey: dashboardQueryKeys.account,
    queryFn: getAccountSummary,
    staleTime: 20_000,
  });
}

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: [...dashboardQueryKeys.recentActivity, limit],
    queryFn: () => getRecentTransactions(limit),
    staleTime: 15_000,
  });
}
