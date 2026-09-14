import {
  SearchX,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";

import { ROUTES } from "@/routes/paths";

export default function AdminNotFoundPage() {
  return (
    <main
      className="grid min-h-screen place-items-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <section
        className="w-full max-w-md rounded-[var(--radius-card)] border p-8 text-center"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <SearchX
          size={38}
          className="mx-auto"
          style={{ color: "var(--brand-accent)" }}
        />
        <h1
          className="mt-4 text-xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          Admin page not found
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--muted)" }}
        >
          The administration route you requested does not exist.
        </p>
        <Link
          to={ROUTES.dashboard}
          className="mt-6 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold"
          style={{
            color: "#fff",
            background: "var(--brand-primary)",
          }}
        >
          Back to overview
        </Link>
      </section>
    </main>
  );
}
