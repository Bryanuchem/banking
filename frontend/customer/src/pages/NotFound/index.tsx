import { Link } from "react-router-dom";

import { Button, ErrorState } from "@/components/common";
import { ROUTES } from "@/routes/paths";

export default function NotFoundPage() {
  return (
    <main
      className="grid min-h-screen place-items-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-lg">
        <ErrorState
          title="Page not found"
          description="The page you requested does not exist or may have moved."
          action={
            <Link to={ROUTES.dashboard}>
              <Button>Return home</Button>
            </Link>
          }
        />
      </div>
    </main>
  );
}
