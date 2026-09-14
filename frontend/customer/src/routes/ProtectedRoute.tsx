import { useQuery } from "@tanstack/react-query";
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { getCurrentUser } from "@/api/auth";
import Button from "@/components/common/Button";
import { useAuthContext } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

export default function ProtectedRoute() {
  const auth = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const meQuery = useQuery({
    queryKey: ["auth", "customer-route-me"],
    queryFn: getCurrentUser,
    enabled: auth.isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

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

  if (meQuery.isLoading) {
    return (
      <div
        className="grid min-h-screen place-items-center"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="size-7 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-primary)" }}
        />
      </div>
    );
  }

  if (meQuery.isError) {
    auth.signOut();
    return (
      <Navigate
        to={ROUTES.login}
        replace
      />
    );
  }

  if (!meQuery.data?.account_number) {
    return (
      <main
        className="grid min-h-screen place-items-center px-4"
        style={{ background: "var(--bg)" }}
      >
        <section
          className="w-full max-w-md rounded-2xl border p-7 text-center"
          style={{
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <h1 className="text-xl font-semibold">
            No customer banking account
          </h1>
          <p
            className="mt-3 text-sm leading-6"
            style={{ color: "var(--muted)" }}
          >
            This identity does not own a customer virtual account, so it
            cannot enter the customer banking workspace.
          </p>

          <Button
            className="mt-6 w-full"
            onClick={() => {
              auth.signOut();
              navigate(ROUTES.login, {
                replace: true,
              });
            }}
          >
            Return to customer sign in
          </Button>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
