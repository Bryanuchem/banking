import { Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import PublicLayout from "@/layouts/PublicLayout";
import DashboardPage from "@/pages/Dashboard";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import LoginPage from "@/pages/Login";
import NotFoundPage from "@/pages/NotFound";
import PaymentsPage from "@/pages/Payments";
import ProfilePage from "@/pages/Profile";
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
      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route
            path={ROUTES.forgotPassword}
            element={<ForgotPasswordPage />}
          />
          <Route
            path={ROUTES.resetPassword}
            element={<ResetPasswordPage />}
          />
          <Route path={ROUTES.twoFactor} element={<TwoFactorPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path={ROUTES.transfer} element={<TransfersPage />} />
          <Route path={ROUTES.activity} element={<TransactionsPage />} />
          <Route path={ROUTES.withdraw} element={<WithdrawalsPage />} />
          <Route path={ROUTES.payments} element={<PaymentsPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
