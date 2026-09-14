import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAdminAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

export default function ProtectedRoute() {
  const auth = useAdminAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <div
        className="grid min-h-screen place-items-center"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="size-7 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-accent)" }}
        />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location }}
      />
    );
  }

  if (!auth.isAdmin) {
    return (
      <Navigate
        to={ROUTES.forbidden}
        replace
      />
    );
  }

  return <Outlet />;
}
