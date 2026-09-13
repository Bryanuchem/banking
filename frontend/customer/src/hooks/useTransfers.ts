import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  authorizeTransfer,
  createTransfer,
  lookupAccount,
} from "@/api/transfers";
import { dashboardQueryKeys } from "@/hooks/useDashboard";
import type { TransferDraft } from "@/types/transfers";

export function useRecipientLookup(accountNumber: string) {
  const normalized = accountNumber.trim();

  return useQuery({
    queryKey: ["recipient-lookup", normalized],
    queryFn: () => lookupAccount(normalized),
    enabled: normalized.length >= 6,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      draft,
      idempotencyKey,
      stepUpAuthorization,
    }: {
      draft: TransferDraft;
      idempotencyKey: string;
      stepUpAuthorization?: string;
    }) =>
      createTransfer(
        draft,
        idempotencyKey,
        stepUpAuthorization,
      ),
    onSuccess: async () => {
      await Promise.all([
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

export function useAuthorizeTransfer() {
  return useMutation({
    mutationFn: authorizeTransfer,
  });
}
