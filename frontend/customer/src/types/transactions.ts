export type TransactionItem = {
  id: string;
  reference: string;
  type: string;
  direction: "debit" | "credit" | string;
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  balance_after: string;
  created_at: string;
};

export type TransactionFilters = {
  search?: string;
  type?: string;
  status?: string;
  direction?: string;
};
