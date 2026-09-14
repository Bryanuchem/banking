import { apiClient } from "@/api/client";
import type {
  AdminAccountDetail,
  AdminAccountListResponse,
  AdminCreditResponse,
  AdminDashboardSummary,
  AdminUserDetail,
  AdminUserItem,
  AdminUserListResponse,
  AdminNotificationList,
  AdminNotificationSendPayload,
  AdminSentNotificationList,
} from "@/types/admin";

export async function getAdminDashboardSummary(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return (
    await apiClient.get<AdminDashboardSummary>(
      "/admin/dashboard/summary",
      { params },
    )
  ).data;
}

export async function getAdminUsers(params: {
  q?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<AdminUserListResponse>(
      "/admin/users",
      { params },
    )
  ).data;
}

export async function getAdminUser(userId: string) {
  return (
    await apiClient.get<AdminUserDetail>(
      `/admin/users/${userId}`,
    )
  ).data;
}

export async function setAdminUserState(
  userId: string,
  payload: {
    is_active: boolean;
    reason?: string | null;
  },
) {
  return (
    await apiClient.patch<AdminUserItem>(
      `/admin/users/${userId}/state`,
      payload,
    )
  ).data;
}

export async function getAdminAccounts(params: {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<AdminAccountListResponse>(
      "/admin/accounts",
      { params },
    )
  ).data;
}

export async function getAdminAccount(accountId: string) {
  return (
    await apiClient.get<AdminAccountDetail>(
      `/admin/accounts/${accountId}`,
    )
  ).data;
}

export async function setAdminAccountState(
  accountId: string,
  payload: {
    status: "active" | "frozen" | "closed";
    reason?: string | null;
  },
) {
  return (
    await apiClient.patch<AdminAccountDetail>(
      `/admin/accounts/${accountId}/state`,
      payload,
    )
  ).data;
}

export async function creditAdminAccount(
  accountId: string,
  payload: {
    amount: string;
    description: string;
  },
  idempotencyKey: string,
) {
  return (
    await apiClient.post<AdminCreditResponse>(
      `/admin/accounts/${accountId}/credit`,
      payload,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    )
  ).data;
}



export async function deleteAdminCustomerAccount(
  userId: string,
  payload: {
    confirmation: string;
    reason?: string | null;
  },
) {
  return (
    await apiClient.delete<{
      account_id: string;
      account_number: string;
      deleted_at: string;
      user_deactivated: boolean;
      history_preserved: boolean;
    }>(
      `/admin/users/${userId}/account`,
      { data: payload },
    )
  ).data;
}

export async function getAdminRecentFinancial(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  return (
    await apiClient.get<import("@/types/admin").AdminTransactionItem[]>(
      "/admin/dashboard/recent-financial",
      {
        params: {
          limit: params?.limit ?? 6,
          start_date: params?.start_date,
          end_date: params?.end_date,
        },
      },
    )
  ).data;
}

export async function getAdminTransactions(params: {
  q?: string;
  status?: string;
  tx_type?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<import("@/types/admin").AdminTransactionListResponse>(
      "/admin/transactions",
      { params },
    )
  ).data;
}

export async function getAdminTransaction(transactionId: string) {
  return (
    await apiClient.get<import("@/types/admin").AdminTransactionDetail>(
      `/admin/transactions/${transactionId}`,
    )
  ).data;
}

export async function getAdminTransfers(params: {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<import("@/types/admin").AdminTransferListResponse>(
      "/admin/transfers",
      { params },
    )
  ).data;
}

export async function getAdminTransfer(transferId: string) {
  return (
    await apiClient.get<import("@/types/admin").AdminTransferDetail>(
      `/admin/transfers/${transferId}`,
    )
  ).data;
}

export async function getAdminDeposits(params: {
  q?: string;
  status?: string;
  provider?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<import("@/types/admin").AdminDepositListResponse>(
      "/admin/deposits",
      { params },
    )
  ).data;
}

export async function getAdminDeposit(depositId: string) {
  return (
    await apiClient.get<import("@/types/admin").AdminDepositDetail>(
      `/admin/deposits/${depositId}`,
    )
  ).data;
}

export async function getAdminPayments(params: {
  q?: string;
  purpose?: string;
  status?: string;
  provider?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<import("@/types/admin").AdminPaymentListResponse>(
      "/admin/payments",
      { params },
    )
  ).data;
}

export async function getAdminPayment(paymentId: string) {
  return (
    await apiClient.get<import("@/types/admin").AdminPaymentDetail>(
      `/admin/payments/${paymentId}`,
    )
  ).data;
}


export type AdminCsvResource =
  | "customers"
  | "accounts"
  | "transactions"
  | "transfers"
  | "deposits"
  | "payments"
  | "withdrawals"
  | "audit-logs"
  | "reconciliation";

export async function exportAdminCsv(
  resource: AdminCsvResource,
  params: Record<string, string | undefined>,
) {
  const response = await apiClient.get<Blob>(
    `/admin/exports/${resource}.csv`,
    {
      params,
      responseType: "blob",
    },
  );

  const disposition =
    response.headers["content-disposition"] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/i);

  return {
    blob: response.data,
    filename: match?.[1] ?? `${resource}.csv`,
  };
}

export async function getAdminWithdrawals(params: {
  q?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminWithdrawalListResponse
    >(
      "/admin/withdrawals",
      { params },
    )
  ).data;
}

export async function getAdminWithdrawal(
  withdrawalId: string,
) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminWithdrawalDetail
    >(`/admin/withdrawals/${withdrawalId}`)
  ).data;
}

export async function approveAdminWithdrawal(
  withdrawalId: string,
  adminNote?: string,
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminWithdrawalDetail
    >(
      `/admin/withdrawals/${withdrawalId}/approve`,
      {
        admin_note: adminNote?.trim() || null,
      },
    )
  ).data;
}

export async function rejectAdminWithdrawal(
  withdrawalId: string,
  reason: string,
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminWithdrawalDetail
    >(
      `/admin/withdrawals/${withdrawalId}/reject`,
      { reason },
    )
  ).data;
}

export async function completeAdminWithdrawal(
  withdrawalId: string,
  payload: {
    external_reference: string;
    admin_note?: string;
  },
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminWithdrawalDetail
    >(
      `/admin/withdrawals/${withdrawalId}/complete`,
      {
        external_reference:
          payload.external_reference.trim(),
        admin_note:
          payload.admin_note?.trim() || null,
      },
    )
  ).data;
}

export async function failAdminWithdrawal(
  withdrawalId: string,
  reason: string,
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminWithdrawalDetail
    >(
      `/admin/withdrawals/${withdrawalId}/fail`,
      { reason },
    )
  ).data;
}

export async function getAdminSettings() {
  return (
    await apiClient.get<
      import("@/types/admin").AdminSettingItem[]
    >("/admin/settings")
  ).data;
}

export async function updateAdminSettings(
  updates: Array<{
    key: string;
    value: unknown;
  }>,
) {
  return (
    await apiClient.patch<{
      items: import("@/types/admin").AdminSettingItem[];
    }>(
      "/admin/settings",
      { updates },
    )
  ).data;
}

export async function getAdminProviders() {
  return (
    await apiClient.get<
      import("@/types/admin").AdminProviderSummary[]
    >("/admin/settings/providers")
  ).data;
}

export async function getAdminProvider(
  provider: string,
) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminProviderDetail
    >(`/admin/settings/providers/${provider}`)
  ).data;
}

export async function updateAdminProvider(
  provider: string,
  values: Record<string, unknown>,
) {
  return (
    await apiClient.patch<
      import("@/types/admin").AdminProviderDetail
    >(
      `/admin/settings/providers/${provider}`,
      { values },
    )
  ).data;
}

export async function sendAdminTestEmail(
  recipient: string,
) {
  return (
    await apiClient.post<{ sent: boolean }>(
      "/admin/settings/test-email",
      { recipient },
    )
  ).data;
}


export async function getAdminSecurityOverview() {
  return (
    await apiClient.get<
      import("@/types/admin").AdminSecurityOverview
    >("/admin/security/overview")
  ).data;
}

export async function getAdminAdministrators(params: {
  q?: string;
  status?: string;
  two_factor?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminAdministratorListResponse
    >("/admin/administrators", { params })
  ).data;
}

export async function authorizeAdminStepUp(
  scope: string,
  code: string,
) {
  return (
    await apiClient.post<{
      authorization_token: string;
      scope: string;
    }>("/auth/2fa/authorize", { scope, code })
  ).data;
}

function stepUpHeaders(token?: string) {
  return token
    ? { "X-Step-Up-Authorization": token }
    : undefined;
}

export async function createAdminAdministrator(
  payload: {
    first_name: string;
    last_name: string;
    email: string;
    temporary_password: string;
    is_active: boolean;
  },
  stepUpToken?: string,
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminAdministratorItem
    >(
      "/admin/administrators",
      payload,
      { headers: stepUpHeaders(stepUpToken) },
    )
  ).data;
}

export async function promoteAdminCustomer(
  userId: string,
  stepUpToken?: string,
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminAdministratorItem
    >(
      "/admin/administrators/promote",
      { user_id: userId },
      { headers: stepUpHeaders(stepUpToken) },
    )
  ).data;
}

export async function setAdminAdministratorState(
  administratorId: string,
  payload: {
    is_active: boolean;
    reason?: string;
  },
  stepUpToken?: string,
) {
  return (
    await apiClient.patch<
      import("@/types/admin").AdminAdministratorItem
    >(
      `/admin/administrators/${administratorId}/state`,
      payload,
      { headers: stepUpHeaders(stepUpToken) },
    )
  ).data;
}

export async function getAdminSessions(params: {
  q?: string;
  user_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminSessionListResponse
    >("/admin/sessions", { params })
  ).data;
}

export async function revokeAdminSession(
  sessionId: string,
  stepUpToken?: string,
) {
  return (
    await apiClient.delete<{ message: string }>(
      `/admin/sessions/${sessionId}`,
      { headers: stepUpHeaders(stepUpToken) },
    )
  ).data;
}

export async function revokeAllAdminUserSessions(
  userId: string,
  stepUpToken?: string,
) {
  return (
    await apiClient.delete<{ count: number }>(
      `/admin/users/${userId}/sessions`,
      { headers: stepUpHeaders(stepUpToken) },
    )
  ).data;
}

export async function getAdminAuditLogs(params: {
  q?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminAuditLogListResponseV2
    >("/admin/audit-logs", { params })
  ).data;
}

export async function getAdminReconciliation() {
  return (
    await apiClient.get<
      import("@/types/admin").AdminReconciliationReport
    >("/admin/reconciliation")
  ).data;
}

export async function runAdminReconciliation(
  stepUpToken?: string,
) {
  return (
    await apiClient.post<{
      report: import("@/types/admin").AdminReconciliationReport;
      completed_at: string;
    }>(
      "/admin/reconciliation/run",
      {},
      { headers: stepUpHeaders(stepUpToken) },
    )
  ).data;
}


// Pass 6.5 notifications
export async function getAdminInboxNotifications(params?: { unread_only?: boolean }) {
  const { data } = await apiClient.get<AdminNotificationList>("/notifications", { params });
  return data;
}
export async function getAdminNotificationUnreadCount() {
  const { data } = await apiClient.get<{ unread: number }>("/notifications/unread-count");
  return data;
}
export async function markAdminNotificationRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}
export async function markAllAdminNotificationsRead() {
  await apiClient.post("/notifications/read-all");
}
export async function sendAdminNotification(payload: AdminNotificationSendPayload) {
  const { data } = await apiClient.post<{ notification_id: string; recipient_count: number }>("/admin/notifications", payload);
  return data;
}
export async function getAdminSentNotifications() {
  const { data } = await apiClient.get<AdminSentNotificationList>("/admin/notifications/sent");
  return data;
}


// Pass 6.6 background operations
export async function getAdminJobs() {
  return (
    await apiClient.get<
      import("@/types/admin").AdminJobsResponse
    >("/admin/jobs")
  ).data;
}

export async function getAdminJobRuns(
  params?: {
    job_name?: string;
    limit?: number;
    offset?: number;
  },
) {
  return (
    await apiClient.get<
      import("@/types/admin").AdminJobRunListResponse
    >(
      "/admin/jobs/runs",
      { params },
    )
  ).data;
}

export async function runAdminJob(
  jobName: string,
) {
  return (
    await apiClient.post<
      import("@/types/admin").AdminJobRun
    >(`/admin/jobs/${jobName}/run`)
  ).data;
}
