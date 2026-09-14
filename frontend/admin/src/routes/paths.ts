export const ROUTES = {
  login: "/admin/login",
  twoFactor: "/admin/login/2fa",
  forbidden: "/admin/forbidden",
  dashboard: "/admin",
  customers: "/admin/customers",
  accounts: "/admin/accounts",
  accountDetail: "/admin/accounts/:accountId",
  transactions: "/admin/transactions",
  transfers: "/admin/transfers",
  deposits: "/admin/deposits",
  withdrawals: "/admin/withdrawals",
  withdrawalDetail: "/admin/withdrawals/:withdrawalId",
  payments: "/admin/payments",
  settings: "/admin/settings",
  providerSettings: "/admin/settings/payments/:provider",
  auditLogs: "/admin/audit-logs",
  reconciliation: "/admin/reconciliation",
  sessions: "/admin/sessions",
  administrators: "/admin/administrators",
  security: "/admin/security",
  notifications: "/admin/notifications",
  profile: "/admin/profile",
  adminTwoFactor: "/admin/profile/2fa",
  operationsJobs: "/admin/operations/jobs",
} as const;

export function accountDetailPath(
  accountId: string,
) {
  return `/admin/accounts/${accountId}`;
}


export function withdrawalDetailPath(
  withdrawalId: string,
) {
  return `/admin/withdrawals/${withdrawalId}`;
}

export function providerSettingsPath(
  provider: string,
) {
  return `/admin/settings/payments/${provider}`;
}
