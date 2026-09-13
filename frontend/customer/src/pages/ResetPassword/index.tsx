import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { resetPassword } from "@/api/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthSuccess from "@/components/auth/AuthSuccess";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import {
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
  PasswordInput,
} from "@/components/common";
import { ROUTES } from "@/routes/paths";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  resetPasswordSchema,
  zodFieldErrors,
  type FieldErrors,
} from "@/utils/authValidation";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const presetEmail =
    (location.state as { email?: string } | null)
      ?.email ?? "";

  const [values, setValues] = useState({
    email: presetEmail,
    code: "",
    new_password: "",
    confirm_password: "",
  });
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");

    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await resetPassword({
        email: parsed.data.email,
        code: parsed.data.code,
        new_password: parsed.data.new_password,
      });
      setDone(true);
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          "The recovery code is invalid or has expired.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <AuthSuccess
          title="Password updated"
          description="Your password has been changed. Sign in again to continue."
          action={
            <Button
              className="w-full"
              onClick={() =>
                navigate(ROUTES.login, {
                  replace: true,
                })
              }
            >
              Sign in
            </Button>
          }
        />
      </Card>
    );
  }

  function setField(
    key: keyof typeof values,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <Card>
      <div className="space-y-6">
        <PageHeader
          title="Reset your password"
          description="Enter the recovery code and choose a new password."
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
            htmlFor="reset_email"
            error={errors.email}
          >
            <Input
              id="reset_email"
              type="email"
              autoComplete="email"
              value={values.email}
              disabled={submitting}
              onChange={(event) =>
                setField("email", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Recovery code"
            htmlFor="recovery_code"
            error={errors.code}
          >
            <Input
              id="recovery_code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter your recovery code"
              value={values.code}
              disabled={submitting}
              onChange={(event) =>
                setField(
                  "code",
                  event.target.value.replace(/\s/g, ""),
                )
              }
            />
          </FormField>

          <FormField
            label="New password"
            htmlFor="new_password"
            error={errors.new_password}
          >
            <PasswordInput
              id="new_password"
              autoComplete="new-password"
              placeholder="Create a new password"
              value={values.new_password}
              disabled={submitting}
              onChange={(event) =>
                setField(
                  "new_password",
                  event.target.value,
                )
              }
            />
          </FormField>

          <PasswordRequirements
            password={values.new_password}
          />

          <FormField
            label="Confirm new password"
            htmlFor="confirm_new_password"
            error={errors.confirm_password}
          >
            <PasswordInput
              id="confirm_new_password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={values.confirm_password}
              disabled={submitting}
              onChange={(event) =>
                setField(
                  "confirm_password",
                  event.target.value,
                )
              }
            />
          </FormField>

          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            loadingText="Resetting password..."
          >
            Reset password
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
