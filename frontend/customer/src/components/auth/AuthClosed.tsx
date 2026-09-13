import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/common";
import { ROUTES } from "@/routes/paths";

export default function AuthClosed() {
  return (
    <div className="py-5 text-center">
      <div
        className="mx-auto grid size-14 place-items-center rounded-full"
        style={{
          color: "var(--brand-accent)",
          background:
            "color-mix(in srgb, var(--brand-accent) 12%, transparent)",
        }}
      >
        <LockKeyhole size={24} strokeWidth={1.8} />
      </div>
      <h2
        className="mt-5 text-xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        Registration is currently closed
      </h2>
      <p
        className="mx-auto mt-2 max-w-sm text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        New account creation is not available at the moment.
        Please check back later.
      </p>
      <Link to={ROUTES.login} className="mt-6 block">
        <Button className="w-full">Return to sign in</Button>
      </Link>
    </div>
  );
}
