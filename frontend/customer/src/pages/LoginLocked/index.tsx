import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, Card } from "@/components/common";
import { ROUTES } from "@/routes/paths";

export default function LoginLockedPage() {
  return (
    <Card>
      <div className="py-5 text-center">
        <div
          className="mx-auto grid size-14 place-items-center rounded-full"
          style={{
            color: "var(--warning)",
            background:
              "color-mix(in srgb, var(--warning) 13%, transparent)",
          }}
        >
          <LockKeyhole size={24} strokeWidth={1.8} />
        </div>

        <h1
          className="mt-5 text-xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          Sign in temporarily unavailable
        </h1>

        <p
          className="mx-auto mt-2 max-w-sm text-sm leading-6"
          style={{ color: "var(--muted)" }}
        >
          Too many unsuccessful attempts were made. Please try
          again later.
        </p>

        <Link to={ROUTES.login} className="mt-6 block">
          <Button className="w-full">
            Return to sign in
          </Button>
        </Link>

        <Link
          to={ROUTES.forgotPassword}
          className="mt-4 block text-sm font-medium"
          style={{ color: "var(--brand-accent)" }}
        >
          Forgot your password?
        </Link>
      </div>
    </Card>
  );
}
