import { Outlet } from "react-router-dom";

import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useAdminLayout } from "@/context/LayoutContext";

export default function AdminLayout() {
  const { sidebarCollapsed } =
    useAdminLayout();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <AdminSidebar />

      <div
        className={[
          "min-h-screen transition-[padding] duration-200",
          sidebarCollapsed
            ? "lg:pl-[84px]"
            : "lg:pl-[276px]",
        ].join(" ")}
      >
        <AdminHeader />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
