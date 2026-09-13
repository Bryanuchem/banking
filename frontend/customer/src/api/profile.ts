import { apiClient } from "@/api/client";
import type { AuthUser } from "@/types/auth";

export type TwoFactorStatus = {
  enabled: boolean;
  recovery_codes_remaining: number;
};

export type UserSession = {
  id: string;
  current: boolean;
  user_agent?: string | null;
  ip_address?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  expires_at: string;
};

export type SecurityActivityItem = {
  id: string;
  event: string;
  details?: string | null;
  created_at: string;
};

export async function getProfile(): Promise<AuthUser> {
  return (await apiClient.get<AuthUser>("/auth/me")).data;
}

export async function updateProfile(payload: {
  first_name: string;
  last_name: string;
  phone?: string | null;
}): Promise<AuthUser> {
  return (
    await apiClient.patch<AuthUser>(
      "/auth/profile",
      payload,
    )
  ).data;
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}) {
  return (
    await apiClient.post("/auth/password/change", payload)
  ).data;
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  return (
    await apiClient.get<TwoFactorStatus>(
      "/auth/2fa/status",
    )
  ).data;
}

export async function beginTwoFactorSetup(): Promise<{
  secret: string;
  provisioning_uri: string;
}> {
  return (
    await apiClient.post("/auth/2fa/setup")
  ).data;
}

export async function confirmTwoFactorSetup(
  code: string,
): Promise<{
  enabled: boolean;
  recovery_codes: string[];
}> {
  return (
    await apiClient.post("/auth/2fa/confirm", {
      code,
    })
  ).data;
}

export async function disableTwoFactor(
  code: string,
) {
  return (
    await apiClient.post("/auth/2fa/disable", {
      code,
    })
  ).data;
}

export async function regenerateRecoveryCodes(
  code: string,
): Promise<{
  enabled: boolean;
  recovery_codes: string[];
}> {
  return (
    await apiClient.post(
      "/auth/2fa/recovery-codes",
      { code },
    )
  ).data;
}

export async function getSessions(): Promise<UserSession[]> {
  return (
    await apiClient.get<UserSession[]>(
      "/auth/sessions",
    )
  ).data;
}

export async function revokeSession(
  sessionId: string,
) {
  return (
    await apiClient.delete(
      `/auth/sessions/${sessionId}`,
    )
  ).data;
}

export async function revokeOtherSessions() {
  return (
    await apiClient.delete("/auth/sessions")
  ).data;
}

export async function getSecurityActivity(): Promise<
  SecurityActivityItem[]
> {
  return (
    await apiClient.get<SecurityActivityItem[]>(
      "/auth/security/activity",
    )
  ).data;
}
