import { apiClient } from "@/api/client";
import type {
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  TwoFactorVerifyRequest,
} from "@/types/auth";

export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/login",
    payload,
  );
  return data;
}

export async function register(
  payload: RegisterRequest,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/forgot-password",
    payload,
  );
  return data;
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/reset-password",
    payload,
  );
  return data;
}

export async function verifyTwoFactor(
  payload: TwoFactorVerifyRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/2fa/verify",
    payload,
  );
  return data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
