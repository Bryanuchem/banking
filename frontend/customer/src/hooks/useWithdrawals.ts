import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  authorizeWithdrawalFee,
  cancelWithdrawal,
  completeCashAppApproval,
  createWithdrawal,
  getPaymentProviders,
  getWithdrawal,
  getWithdrawalQuote,
  getWithdrawals,
  initializeWithdrawalFee,
  verifyPayment,
} from "@/api/withdrawals";
import { dashboardQueryKeys } from "@/hooks/useDashboard";
import type {
  PaymentProviderName,
  WithdrawalDraft,
} from "@/types/withdrawals";

export const withdrawalQueryKeys = {
  all: ["withdrawals"] as const,
  detail: (id: string) =>
    ["withdrawals", "detail", id] as const,
  providers: ["payment-providers"] as const,
  quote: (amount: string) =>
    ["withdrawal-quote", amount] as const,
};

export function useWithdrawalQuote(amount: string) {
  const numeric = Number(amount);

  return useQuery({
    queryKey: withdrawalQueryKeys.quote(amount),
    queryFn: () => getWithdrawalQuote(amount),
    enabled:
      amount.trim().length > 0 &&
      Number.isFinite(numeric) &&
      numeric > 0,
    staleTime: 15_000,
    retry: false,
  });
}

export function useWithdrawals(limit = 50) {
  return useQuery({
    queryKey: [...withdrawalQueryKeys.all, limit],
    queryFn: () => getWithdrawals(limit, 0),
    staleTime: 10_000,
  });
}

export function useWithdrawalDetail(
  withdrawalId: string | null,
) {
  return useQuery({
    queryKey: withdrawalQueryKeys.detail(
      withdrawalId ?? "",
    ),
    queryFn: () => getWithdrawal(withdrawalId!),
    enabled: Boolean(withdrawalId),
    retry: false,
  });
}

export function usePaymentProviders() {
  return useQuery({
    queryKey: withdrawalQueryKeys.providers,
    queryFn: getPaymentProviders,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      draft,
      idempotencyKey,
    }: {
      draft: WithdrawalDraft;
      idempotencyKey: string;
    }) => createWithdrawal(draft, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: withdrawalQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.account,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.recentActivity,
        }),
        queryClient.invalidateQueries({
          queryKey: ["transactions"],
        }),
      ]);
    },
  });
}

export function useInitializeWithdrawalFee() {
  return useMutation({
    mutationFn: ({
      withdrawalId,
      provider,
      stepUpAuthorization,
    }: {
      withdrawalId: string;
      provider: PaymentProviderName;
      stepUpAuthorization?: string;
    }) =>
      initializeWithdrawalFee(
        withdrawalId,
        provider,
        stepUpAuthorization,
      ),
  });
}

export function useAuthorizeWithdrawalFee() {
  return useMutation({
    mutationFn: authorizeWithdrawalFee,
  });
}

export function useVerifyWithdrawalFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: withdrawalQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.account,
        }),
      ]);
    },
  });
}

export function useCancelWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelWithdrawal,
    onSuccess: async (withdrawal) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: withdrawalQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: withdrawalQueryKeys.detail(
            withdrawal.id,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.account,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.recentActivity,
        }),
        queryClient.invalidateQueries({
          queryKey: ["transactions"],
        }),
      ]);
    },
  });
}


export function useCompleteCashAppApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      grantId,
    }: {
      paymentId: string;
      grantId: string;
    }) =>
      completeCashAppApproval(paymentId, grantId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: withdrawalQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.account,
        }),
      ]);
    },
  });
}
