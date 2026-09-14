export type AuthUser = {
  id: string;
  email: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  two_factor_enabled?: boolean;
  account_number?: string | null;
  currency?: string | null;
  is_admin?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
  remember_me?: boolean;
};

export type LoginResponse = {
  access_token?: string;
  token_type?: string;
  requires_two_factor?: boolean;
  two_factor_required?: boolean;
  challenge_token?: string;
  message?: string;
};

export type RegisterRequest = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  new_password: string;
};

export type TwoFactorVerifyRequest = {
  challenge_token: string;
  code?: string;
  recovery_code?: string;
  remember_me?: boolean;
};

export type MessageResponse = {
  message?: string;
  success?: boolean;
};
