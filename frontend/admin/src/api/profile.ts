import { apiClient } from "@/api/client";
import type { AdminUser } from "@/types/auth";

export type TwoFactorStatus = {
  enabled: boolean;
  recovery_codes_remaining: number;
};

export async function updateAdminProfile(payload: {
  first_name: string;
  last_name: string;
  phone: string | null;
}) {
  const { data } = await apiClient.patch<AdminUser>(
    "/auth/profile",
    payload,
  );
  return data;
}

export async function getAdminTwoFactorStatus(): Promise<TwoFactorStatus> {
  return (
    await apiClient.get<TwoFactorStatus>(
      "/auth/2fa/status",
    )
  ).data;
}

export async function beginAdminTwoFactorSetup(): Promise<{
  secret: string;
  provisioning_uri: string;
}> {
  return (
    await apiClient.post("/auth/2fa/setup")
  ).data;
}

export async function confirmAdminTwoFactorSetup(
  code: string,
): Promise<{
  enabled: boolean;
  recovery_codes: string[];
}> {
  return (
    await apiClient.post(
      "/auth/2fa/confirm",
      { code },
    )
  ).data;
}

export async function disableAdminTwoFactor(
  code: string,
) {
  return (
    await apiClient.post(
      "/auth/2fa/disable",
      { code },
    )
  ).data;
}

export async function regenerateAdminRecoveryCodes(
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
