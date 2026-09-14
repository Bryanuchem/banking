import { apiClient } from "@/api/client";
import type {
  AdminUser,
  LoginRequest,
  LoginResponse,
  LoginTwoFactorRequest,
} from "@/types/auth";

export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  return (
    await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    )
  ).data;
}

export async function completeTwoFactorLogin(
  payload: LoginTwoFactorRequest,
): Promise<LoginResponse> {
  return (
    await apiClient.post<LoginResponse>(
      "/auth/login/2fa",
      payload,
    )
  ).data;
}

export async function getCurrentUser(): Promise<AdminUser> {
  return (
    await apiClient.get<AdminUser>("/auth/me")
  ).data;
}

export async function logout() {
  await apiClient.post("/auth/logout");
}
