export type AccountLookup = {
  account_number: string;
  account_name: string;
  currency: string;
};

export type TransferDraft = {
  recipient_account_number: string;
  amount: string;
  narration: string;
};

export type TransferResponse = {
  id: string;
  reference: string;
  sender_account_number: string;
  recipient_account_number: string;
  recipient_name: string;
  amount: string;
  currency: string;
  narration: string | null;
  status: string;
  created_at: string;
};

export type StepUpResponse = {
  authorization_token: string;
  scope: string;
};
