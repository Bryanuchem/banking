import { Navigate, Outlet } from "react-router-dom";

import { useAuthContext } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

export default function PublicRoute() {
  const auth = useAuthContext();

  if (auth.isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
