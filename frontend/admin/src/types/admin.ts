export type PageMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type AdminUserItem = {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type LinkedAccount = {
  id: string;
  account_number: string;
  currency: string;
  available_balance: string;
  held_balance: string;
  status: string;
  created_at: string;
};

export type AdminUserDetail = AdminUserItem & {
  account: LinkedAccount | null;
};

export type AdminUserListResponse = {
  items: AdminUserItem[];
  page: PageMeta;
};

export type AdminAccountOwner = {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
};

export type AdminAccountItem = {
  id: string;
  user_id: string;
  account_number: string;
  currency: string;
  available_balance: string;
  held_balance: string;
  status: string;
  created_at: string;
  owner: AdminAccountOwner;
};

export type AdminAccountDetail = AdminAccountItem;

export type AdminAccountListResponse = {
  items: AdminAccountItem[];
  page: PageMeta;
};

export type AdminDashboardSummary = {
  customers: {
    total: number;
    active: number;
    inactive: number;
  };
  accounts: {
    total: number;
    active: number;
    frozen: number;
    closed: number;
  };
  financial: {
    period_start: string;
    period_end: string;
    transactions_count: number;
    payments_count: number;
    transfers_count: number;
    deposits_count: number;
  };
  withdrawals: {
    pending_review: number;
    processing: number;
  };
};

export type AdminCreditResponse = {
  transaction_id: string;
  reference: string;
  account_id: string;
  account_number: string;
  amount: string;
  currency: string;
  balance_after: string;
  description: string;
  created_at: string;
};

export type AdminFinancialParty = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type AdminFinancialAccount = {
  account_id: string;
  account_number: string;
  currency: string;
};

export type AdminLedgerEntry = {
  id: string;
  entry_type: string;
  amount: string;
  balance_after: string;
  created_at: string;
  account: AdminFinancialAccount;
  customer: AdminFinancialParty;
};

export type AdminTransactionItem = {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  created_at: string;
  customer: AdminFinancialParty | null;
  account: AdminFinancialAccount | null;
};

export type AdminTransactionDetail = AdminTransactionItem & {
  ledger_entries: AdminLedgerEntry[];
};

export type AdminTransactionListResponse = {
  items: AdminTransactionItem[];
  page: PageMeta;
};

export type AdminTransferItem = {
  id: string;
  transaction_id: string;
  reference: string;
  status: string;
  amount: string;
  currency: string;
  narration: string | null;
  created_at: string;
  sender: AdminFinancialParty;
  sender_account: AdminFinancialAccount;
  recipient: AdminFinancialParty;
  recipient_account: AdminFinancialAccount;
};

export type AdminTransferDetail = AdminTransferItem & {
  ledger_entries: AdminLedgerEntry[];
};

export type AdminTransferListResponse = {
  items: AdminTransferItem[];
  page: PageMeta;
};

export type AdminDepositPaymentAttempt = {
  id: string;
  provider: string;
  channel: string | null;
  provider_channel: string | null;
  internal_reference: string;
  provider_reference: string | null;
  amount: string;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type AdminDepositItem = {
  id: string;
  user_id: string;
  account_id: string;
  transaction_id: string | null;
  amount: string;
  currency: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  customer: AdminFinancialParty;
  account: AdminFinancialAccount;
  provider: string | null;
};

export type AdminDepositDetail = AdminDepositItem & {
  payment_attempts: AdminDepositPaymentAttempt[];
  transaction_reference: string | null;
  ledger_entries: AdminLedgerEntry[];
};

export type AdminDepositListResponse = {
  items: AdminDepositItem[];
  page: PageMeta;
};

export type AdminPaymentItem = {
  id: string;
  user_id: string;
  withdrawal_id: string | null;
  deposit_id: string | null;
  provider: string;
  channel: string | null;
  provider_channel: string | null;
  internal_reference: string;
  provider_reference: string | null;
  amount: string;
  currency: string;
  status: string;
  purpose: string;
  paid_at: string | null;
  created_at: string;
  customer: AdminFinancialParty;
};

export type AdminPaymentDetail = AdminPaymentItem & {
  linked_reference: string | null;
};

export type AdminPaymentListResponse = {
  items: AdminPaymentItem[];
  page: PageMeta;
};

export type AdminWithdrawalFeePayment = {
  id: string;
  provider: string;
  internal_reference: string;
  provider_reference: string | null;
  amount: string;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type AdminWithdrawalActivity = {
  key: string;
  label: string;
  created_at: string;
  actor_email: string | null;
  reason: string | null;
  external_reference: string | null;
};

export type AdminWithdrawalItem = {
  id: string;
  user_id: string;
  account_id: string;
  transaction_id: string | null;
  amount: string;
  fee_amount: string;
  currency: string;
  status: string;
  destination_bank_name: string;
  destination_account_number: string;
  destination_account_name: string;
  external_reference: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  customer: AdminFinancialParty;
  account: AdminFinancialAccount;
};

export type AdminWithdrawalDetail = AdminWithdrawalItem & {
  fee_payment: AdminWithdrawalFeePayment | null;
  activity: AdminWithdrawalActivity[];
};

export type AdminWithdrawalListResponse = {
  items: AdminWithdrawalItem[];
  page: PageMeta;
};

export type AdminSettingItem = {
  category: string;
  key: string;
  value_type: "string" | "number" | "boolean" | "json";
  is_editable: boolean;
  is_secret: boolean;
  configured: boolean;
  value: unknown | null;
  description: string | null;
  formula: string | null;
};

export type AdminProviderSummary = {
  provider: "paystack" | "stripe" | "paypal" | "cash-app";
  label: string;
  configured: boolean;
  configured_fields: number;
  required_fields: number;
};

export type AdminProviderDetail = AdminProviderSummary & {
  fields: AdminSettingItem[];
};


export type AdminSecurityOverview = {
  summary: {
    administrators: number;
    active_admin_sessions: number;
    admins_without_2fa: number;
    failed_admin_attempts: number;
    reconciliation_status: "healthy" | "warning" | "critical";
    reconciliation_checked: number;
    reconciliation_mismatched: number;
  };
  policy: {
    password_min_length: number;
    require_uppercase: boolean;
    require_numbers: boolean;
    require_special_characters: boolean;
    two_factor_policy: string;
  };
};

export type AdminAdministratorItem = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  active_sessions: number;
  last_login_at: string | null;
  created_at: string;
  has_customer_account: boolean;
};

export type AdminAdministratorListResponse = {
  items: AdminAdministratorItem[];
  total: number;
};

export type AdminSessionItem = {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  user_type: "administrator" | "customer";
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  status: "active" | "revoked" | "expired";
  current: boolean;
};

export type AdminSessionListResponse = {
  items: AdminSessionItem[];
  total: number;
};

export type AdminAuditLogItemV2 = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type AdminAuditLogListResponseV2 = {
  items: AdminAuditLogItemV2[];
  total: number;
};

export type AdminReconciliationAccount = {
  account_id: string;
  account_number: string;
  customer_name: string;
  actual_available_balance: string;
  expected_available_balance: string;
  actual_held_balance: string;
  expected_held_balance: string;
  available_difference: string;
  held_difference: string;
  status: "healthy" | "warning" | "critical";
};

export type AdminReconciliationReport = {
  summary: {
    checked: number;
    mismatched: number;
    account_balance_total: string;
    ledger_balance_total: string;
    held_balance_total: string;
    expected_held_total: string;
    unmatched_transactions: number;
    status: "healthy" | "warning" | "critical";
  };
  accounts: AdminReconciliationAccount[];
};


export type AdminNotificationItem = {
  id: string; title: string; message: string; category: string; severity: string;
  event_type: string; action_url: string | null; metadata: Record<string, unknown> | null;
  created_at: string; read_at: string | null; dismissed_at: string | null;
};
export type AdminNotificationList = { items: AdminNotificationItem[]; total: number; unread: number };
export type AdminNotificationSendPayload = {
  title: string; message: string; severity: "info"|"success"|"warning"|"danger";
  category: "financial"|"security"|"account"|"support"|"system"|"announcement";
  audience: "selected"|"all_active_customers"; user_ids: string[]; action_url?: string | null;
};
export type AdminSentNotificationItem = {
  id:string; title:string; message:string; category:string; severity:string; event_type:string;
  action_url:string|null; recipient_count:number; created_at:string;
};
export type AdminSentNotificationList = { items:AdminSentNotificationItem[]; total:number };


export type AdminJobRun = {
  id: string;
  job_name: string;
  trigger: "schedule" | "manual" | string;
  status: "running" | "completed" | "warning" | "failed" | "skipped" | string;
  items_processed: number;
  items_failed: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
  actor_user_id: string | null;
  started_at: string;
  finished_at: string | null;
};

export type AdminJobItem = {
  name: string;
  label: string;
  description: string;
  interval_seconds: number;
  next_run_at: string | null;
  last_run: AdminJobRun | null;
};

export type AdminJobsResponse = {
  worker_enabled: boolean;
  items: AdminJobItem[];
};

export type AdminJobRunListResponse = {
  items: AdminJobRun[];
  total: number;
};
