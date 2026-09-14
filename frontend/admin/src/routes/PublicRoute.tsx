import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAdminAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

export default function PublicRoute() {
  const auth = useAdminAuth();

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

  if (auth.isAuthenticated && auth.isAdmin) {
    return (
      <Navigate
        to={ROUTES.dashboard}
        replace
      />
    );
  }

  return <Outlet />;
}
