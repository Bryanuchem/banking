export type WithdrawalStatus =
  | "awaiting_fee"
  | "fee_paid"
  | "pending_review"
  | "processing"
  | "completed"
  | "failed"
  | "rejected"
  | "cancelled"
  | "pending"
  | string;

export type WithdrawalDraft = {
  amount: string;
  destination_bank_name: string;
  destination_account_number: string;
  destination_account_name: string;
};

export type WithdrawalQuote = {
  amount: string;
  fee_amount: string;
  currency: string;
  recipient_receives: string;
};

export type Withdrawal = {
  id: string;
  amount: string;
  fee_amount: string;
  currency: string;
  destination_bank_name: string;
  destination_account_number: string;
  destination_account_name: string;
  status: WithdrawalStatus;
  created_at: string;
};

export type PaymentProviderName =
  | "paystack"
  | "stripe"
  | "paypal"
  | "cashapp";

export type PaymentCheckout = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  provider: PaymentProviderName;
  channel?: string | null;
  provider_channel?: string | null;
  authorization_url: string;
  access_code?: string | null;
  checkout_data: Record<string, unknown>;
  created_at: string;
};

export type PaymentStatus = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  provider: PaymentProviderName;
  channel?: string | null;
  provider_channel?: string | null;
  paid_at?: string | null;
};

export type StepUpAuthorization = {
  authorization_token: string;
  scope: string;
};
