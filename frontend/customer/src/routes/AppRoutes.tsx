import { Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardPage from "@/pages/Dashboard";
import DepositPage from "@/pages/Deposit";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import LoginPage from "@/pages/Login";
import LoginLockedPage from "@/pages/LoginLocked";
import LandingPage from "@/pages/Landing";
import NotFoundPage from "@/pages/NotFound";
import PaymentsPage from "@/pages/Payments";
import ProfilePage from "@/pages/Profile";
import SecurityPage from "@/pages/Security";
import SecurityActivityPage from "@/pages/Security/Activity";
import ChangePasswordPage from "@/pages/Security/Password";
import SessionsPage from "@/pages/Security/Sessions";
import SecurityTwoFactorPage from "@/pages/Security/TwoFactor";
import SupportPage from "@/pages/Support";
import RegisterPage from "@/pages/Register";
import ResetPasswordPage from "@/pages/ResetPassword";
import TransactionsPage from "@/pages/Transactions";
import TransfersPage from "@/pages/Transfers";
import TwoFactorPage from "@/pages/TwoFactor";
import WithdrawalsPage from "@/pages/Withdrawals";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";
import { ROUTES } from "@/routes/paths";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.landing}
        element={<LandingPage />}
      />

      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route
            path={ROUTES.login}
            element={<LoginPage />}
          />
          <Route
            path={ROUTES.loginLocked}
            element={<LoginLockedPage />}
          />
          <Route
            path={ROUTES.register}
            element={<RegisterPage />}
          />
          <Route
            path={ROUTES.forgotPassword}
            element={<ForgotPasswordPage />}
          />
          <Route
            path={ROUTES.resetPassword}
            element={<ResetPasswordPage />}
          />
          <Route
            path={ROUTES.twoFactor}
            element={<TwoFactorPage />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path={ROUTES.dashboard}
            element={<DashboardPage />}
          />
          <Route
            path={ROUTES.transfer}
            element={<TransfersPage />}
          />
          <Route
            path={ROUTES.activity}
            element={<TransactionsPage />}
          />
          <Route
            path={ROUTES.withdraw}
            element={<WithdrawalsPage />}
          />
          <Route
            path={ROUTES.deposit}
            element={<DepositPage />}
          />
          <Route
            path={ROUTES.payments}
            element={<PaymentsPage />}
          />
          <Route
            path={ROUTES.profile}
            element={<ProfilePage />}
          />
          <Route
            path={ROUTES.security}
            element={<SecurityPage />}
          />
          <Route
            path={ROUTES.securityPassword}
            element={<ChangePasswordPage />}
          />
          <Route
            path={ROUTES.securityTwoFactor}
            element={<SecurityTwoFactorPage />}
          />
          <Route
            path={ROUTES.securitySessions}
            element={<SessionsPage />}
          />
          <Route
            path={ROUTES.securityActivity}
            element={<SecurityActivityPage />}
          />
          <Route
            path={ROUTES.support}
            element={<SupportPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
