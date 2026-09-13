import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  beginTwoFactorSetup,
  changePassword,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getProfile,
  getSecurityActivity,
  getSessions,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  revokeOtherSessions,
  revokeSession,
  updateProfile,
} from "@/api/profile";

export const profileSecurityKeys = {
  profile: ["profile"] as const,
  twoFactor: ["security", "2fa"] as const,
  sessions: ["security", "sessions"] as const,
  activity: ["security", "activity"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileSecurityKeys.profile,
    queryFn: getProfile,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      client.setQueryData(
        profileSecurityKeys.profile,
        user,
      );
      client.setQueryData(["auth-user"], user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: profileSecurityKeys.twoFactor,
    queryFn: getTwoFactorStatus,
  });
}

export function useBeginTwoFactorSetup() {
  return useMutation({
    mutationFn: beginTwoFactorSetup,
  });
}

export function useConfirmTwoFactorSetup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: confirmTwoFactorSetup,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: profileSecurityKeys.twoFactor,
      }),
  });
}

export function useDisableTwoFactor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: disableTwoFactor,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: profileSecurityKeys.twoFactor,
      }),
  });
}

export function useRegenerateRecoveryCodes() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: regenerateRecoveryCodes,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: profileSecurityKeys.twoFactor,
      }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: profileSecurityKeys.sessions,
    queryFn: getSessions,
  });
}

export function useRevokeSession() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: profileSecurityKeys.sessions,
      }),
  });
}

export function useRevokeOtherSessions() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: profileSecurityKeys.sessions,
      }),
  });
}

export function useSecurityActivity() {
  return useQuery({
    queryKey: profileSecurityKeys.activity,
    queryFn: getSecurityActivity,
  });
}
