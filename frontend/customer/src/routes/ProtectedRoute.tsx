import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthContext } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

export default function ProtectedRoute() {
  const auth = useAuthContext();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return <Outlet />;
}
