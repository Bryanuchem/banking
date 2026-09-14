import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import AdminAccountDetailPage from "@/pages/AccountDetail";
import AdminAccountsPage from "@/pages/Accounts";
import AdminCustomersPage from "@/pages/Customers";
import AdminDashboardPage from "@/pages/Dashboard";
import AdminTransactionsPage from "@/pages/Transactions";
import AdminTransfersPage from "@/pages/Transfers";
import AdminDepositsPage from "@/pages/Deposits";
import AdminPaymentsPage from "@/pages/Payments";
import AdminSettingsPage from "@/pages/Settings";
import AdminProviderSettingsPage from "@/pages/ProviderSettings";
import AdminSecurityPage from "@/pages/Security";
import AdminAdministratorsPage from "@/pages/Administrators";
import AdminSessionsPage from "@/pages/AdminSessions";
import AdminAuditLogsPage from "@/pages/AdminAuditLogs";
import AdminReconciliationPage from "@/pages/AdminReconciliation";
import AdminJobsPage from "@/pages/AdminJobs";
import AdminWithdrawalsPage from "@/pages/Withdrawals";
import AdminWithdrawalDetailPage from "@/pages/WithdrawalDetail";
import ForbiddenPage from "@/pages/Forbidden";
import AdminLoginPage from "@/pages/Login";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import AdminNotFoundPage from "@/pages/NotFound";
import AdminNotificationsPage from "@/pages/AdminNotifications";
import AdminProfilePage from "@/pages/AdminProfile";
import AdminOwnTwoFactorPage from "@/pages/AdminTwoFactor";
import AdminTwoFactorPage from "@/pages/TwoFactor";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";
import { ROUTES } from "@/routes/paths";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={ROUTES.dashboard}
            replace
          />
        }
      />

      <Route element={<PublicRoute />}>
        <Route
          path={ROUTES.login}
          element={<AdminLoginPage />}
        />
        <Route
          path={ROUTES.twoFactor}
          element={<AdminTwoFactorPage />}
        />
      </Route>

      <Route
        path={ROUTES.forbidden}
        element={<ForbiddenPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path={ROUTES.dashboard}
            element={<AdminDashboardPage />}
          />
          <Route
            path={ROUTES.customers}
            element={<AdminCustomersPage />}
          />
          <Route
            path={ROUTES.accounts}
            element={<AdminAccountsPage />}
          />
          <Route
            path={ROUTES.accountDetail}
            element={<AdminAccountDetailPage />}
          />

          <Route
            path={ROUTES.transactions}
            element={<AdminTransactionsPage />}
          />
          <Route
            path={ROUTES.transfers}
            element={<AdminTransfersPage />}
          />
          <Route
            path={ROUTES.deposits}
            element={<AdminDepositsPage />}
          />
          <Route
            path={ROUTES.withdrawals}
            element={<AdminWithdrawalsPage />}
          />
          <Route
            path={ROUTES.withdrawalDetail}
            element={<AdminWithdrawalDetailPage />}
          />
          <Route
            path={ROUTES.payments}
            element={<AdminPaymentsPage />}
          />
          <Route
            path={ROUTES.settings}
            element={<AdminSettingsPage />}
          />
          <Route
            path={ROUTES.providerSettings}
            element={<AdminProviderSettingsPage />}
          />
          <Route path={ROUTES.notifications} element={<AdminNotificationsPage />} />
          <Route path={ROUTES.profile} element={<AdminProfilePage />} />
          <Route path={ROUTES.adminTwoFactor} element={<AdminOwnTwoFactorPage />} />
          <Route path={ROUTES.operationsJobs} element={<AdminJobsPage />} />
          <Route
            path={ROUTES.security}
            element={<AdminSecurityPage />}
          />
          <Route
            path={ROUTES.administrators}
            element={<AdminAdministratorsPage />}
          />
          <Route
            path={ROUTES.sessions}
            element={<AdminSessionsPage />}
          />
          <Route
            path={ROUTES.auditLogs}
            element={<AdminAuditLogsPage />}
          />
          <Route
            path={ROUTES.reconciliation}
            element={<AdminReconciliationPage />}
          />
          <Route
            path={ROUTES.auditLogs}
            element={
              <ModulePlaceholder
                title="Audit Logs"
                pass="Pass 6"
                description="Review administrator and security-sensitive activity."
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<AdminNotFoundPage />}
      />
    </Routes>
  );
}
