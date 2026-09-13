import { Outlet } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileNav from "@/components/layout/MobileNav";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { useDashboardUser } from "@/hooks/useDashboard";

export default function AppLayout() {
  const userQuery = useDashboardUser();

  return (
    <SnackbarProvider>
      <div
        className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]"
        style={{ background: "var(--bg)" }}
      >
        <AppSidebar />

        <div className="min-w-0">
          <AppHeader user={userQuery.data} />

          <main
            className="
              mx-auto w-full max-w-[1280px]
              px-4 pb-24 pt-6
              sm:px-6 sm:pt-8
              lg:px-8 lg:pb-10 lg:pt-8
            "
          >
            <Outlet />
          </main>
        </div>

        <MobileNav />
      </div>
    </SnackbarProvider>
  );
}
