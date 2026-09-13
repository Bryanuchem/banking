import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { forgotPassword } from "@/api/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthSuccess from "@/components/auth/AuthSuccess";
import {
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
} from "@/components/common";
import { ROUTES } from "@/routes/paths";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  forgotPasswordSchema,
  zodFieldErrors,
  type FieldErrors,
} from "@/utils/authValidation";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");

    const parsed = forgotPasswordSchema.safeParse({
      email,
    });

    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await forgotPassword(parsed.data);
      setSent(true);
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          "We couldn't send the recovery request.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <AuthSuccess
          title="Check your email"
          description="If an account exists for that address, a recovery code has been sent."
          action={
            <Button
              className="w-full"
              onClick={() =>
                navigate(ROUTES.resetPassword, {
                  state: { email },
                })
              }
            >
              Continue to reset password
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <PageHeader
          title="Forgot your password?"
          description="Enter your email and we'll send recovery instructions if an account exists."
        />

        {formError ? (
          <AuthAlert message={formError} />
        ) : null}

        <form
          onSubmit={submit}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Email address"
            htmlFor="recovery_email"
            error={errors.email}
          >
            <Input
              id="recovery_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={submitting}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </FormField>

          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            loadingText="Sending..."
          >
            Send recovery code
          </Button>
        </form>

        <Link
          to={ROUTES.login}
          className="block text-center text-sm font-medium"
          style={{ color: "var(--brand-accent)" }}
        >
          ← Back to sign in
        </Link>
      </div>
    </Card>
  );
}
