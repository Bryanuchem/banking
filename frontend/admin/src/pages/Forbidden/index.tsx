import {
  ShieldX,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";

import AdminBrand from "@/components/auth/AdminBrand";
import ThemeToggle from "@/components/common/ThemeToggle";
import { ROUTES } from "@/routes/paths";

export default function ForbiddenPage() {
  return (
    <main
      className="relative grid min-h-screen place-items-center px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section
        className="w-full max-w-md rounded-[24px] border p-7 text-center shadow-xl"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <AdminBrand />

        <div
          className="mx-auto mt-8 grid size-16 place-items-center rounded-2xl"
          style={{
            color: "var(--danger)",
            background:
              "color-mix(in srgb, var(--danger) 10%, var(--surface))",
          }}
        >
          <ShieldX size={30} />
        </div>

        <h1
          className="mt-5 text-xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          This account does not have administrator access
        </h1>

        <p
          className="mt-3 text-sm leading-6"
          style={{ color: "var(--muted)" }}
        >
          This account can sign in to the customer experience,
          but it is not authorized to access the administration
          console.
        </p>

        <Link
          to={ROUTES.login}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold"
          style={{
            color: "var(--text)",
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          Return to sign in
        </Link>

        <p
          className="mt-6 border-t pt-5 text-xs"
          style={{
            color: "var(--muted)",
            borderColor: "var(--border)",
          }}
        >
          Administrator access must be granted by an authorized
          administrator.
        </p>
      </section>
    </main>
  );
}
