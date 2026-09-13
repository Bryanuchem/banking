export type AccountStatus =
  | "active"
  | "frozen"
  | "suspended"
  | "closed"
  | string;

export type AccountSummary = {
  id: string;
  account_number: string;
  currency: string;
  available_balance: string;
  held_balance: string;
  status: AccountStatus;
};

export type TransactionDirection = "debit" | "credit" | string;

export type TransactionHistoryItem = {
  id: string;
  reference: string;
  type: string;
  direction: TransactionDirection;
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  balance_after: string;
  created_at: string;
};

export type DashboardUser = {
  id: string;
  email: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  account_number?: string;
  currency?: string;
};
