export type AdminUser = {
  id: string;
  email: string;
  phone?: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  account_number: string | null;
  currency: string | null;
};

export type LoginResponse = {
  two_factor_required: boolean;
  challenge_token?: string | null;
  access_token?: string | null;
  token_type?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
  remember_me?: boolean;
};

export type LoginTwoFactorRequest = {
  challenge_token: string;
  code: string;
  remember_me?: boolean;
};
