import { Link } from "react-router-dom";

import {
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
  PasswordInput,
} from "@/components/common";
import { ROUTES } from "@/routes/paths";

export default function LoginPage() {
  return (
    <Card>
      <div className="space-y-6">
        <PageHeader
          title="Welcome back"
          description="Sign in to access your account."
        />

        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <FormField label="Email address" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              disabled
            />
          </FormField>

          <Button className="w-full" disabled>
            Sign in
          </Button>
        </form>

        <div className="flex items-center justify-between gap-4 text-sm">
          <Link
            to={ROUTES.forgotPassword}
            style={{ color: "var(--muted)" }}
          >
            Forgot password?
          </Link>
          <Link
            to={ROUTES.register}
            className="font-medium"
            style={{ color: "var(--brand-accent)" }}
          >
            Create account
          </Link>
        </div>
      </div>
    </Card>
  );
}
