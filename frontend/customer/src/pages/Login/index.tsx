import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { login } from "@/api/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import {
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
  PasswordInput,
} from "@/components/common";
import { useAuthContext } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";
import {
  getApiErrorMessage,
  isLockedLoginError,
} from "@/utils/apiError";
import {
  loginSchema,
  zodFieldErrors,
  type FieldErrors,
} from "@/utils/authValidation";

export default function LoginPage() {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from =
    (
      location.state as
        | { from?: string }
        | null
    )?.from ?? ROUTES.dashboard;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await login(parsed.data);

      if (
        result.requires_two_factor &&
        result.challenge_token
      ) {
        auth.beginTwoFactor(result.challenge_token);
        navigate(ROUTES.twoFactor, {
          replace: true,
          state: { from },
        });
        return;
      }

      if (!result.access_token) {
        setFormError(
          result.message ??
            "Sign in could not be completed.",
        );
        return;
      }

      auth.signIn(result.access_token);
      navigate(from, { replace: true });
    } catch (error) {
      if (isLockedLoginError(error)) {
        navigate(ROUTES.loginLocked, {
          replace: true,
        });
        return;
      }

      setFormError(
        getApiErrorMessage(
          error,
          "Email or password is incorrect.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          title="Welcome back"
          description="Sign in to access your account."
        />

        {formError ? (
          <AuthAlert message={formError} />
        ) : null}

        <form
          className="space-y-4 sm:space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <FormField
            label="Email address"
            htmlFor="email"
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              disabled={submitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password}
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={values.password}
              disabled={submitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </FormField>

          <div className="flex justify-end">
            <Link
              to={ROUTES.forgotPassword}
              className="text-sm font-medium"
              style={{ color: "var(--brand-accent)" }}
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            loadingText="Signing in..."
          >
            Sign in
          </Button>
        </form>

        <div
          className="flex items-center gap-3"
          style={{ color: "var(--border)" }}
        >
          <span className="h-px flex-1 bg-current" />
          <span
            className="text-xs"
            style={{ color: "var(--muted)" }}
          >
            New here?
          </span>
          <span className="h-px flex-1 bg-current" />
        </div>

        <p
          className="text-center text-sm"
          style={{ color: "var(--muted)" }}
        >
          Create your customer account{" "}
          <Link
            to={ROUTES.register}
            className="font-medium"
            style={{ color: "var(--brand-accent)" }}
          >
            here
          </Link>
          .
        </p>
      </div>
    </Card>
  );
}
