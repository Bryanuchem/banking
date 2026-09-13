import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "@/api/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import AuthClosed from "@/components/auth/AuthClosed";
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
import {
  getApiErrorMessage,
  isRegistrationDisabledError,
} from "@/utils/apiError";
import {
  registerSchema,
  zodFieldErrors,
  type FieldErrors,
} from "@/utils/authValidation";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [values, setValues] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  if (disabled) {
    return (
      <Card>
        <AuthClosed />
      </Card>
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await register({
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
      });

      navigate(ROUTES.login, {
        replace: true,
        state: {
          notice:
            "Account created. You can now sign in.",
        },
      });
    } catch (error) {
      if (isRegistrationDisabledError(error)) {
        setDisabled(true);
        return;
      }

      setFormError(
        getApiErrorMessage(
          error,
          "We couldn't create your account.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function setField(
    field: keyof typeof values,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <Card>
      <div className="space-y-5 sm:space-y-6">
        <PageHeader
          title="Create your account"
          description="A few details to get started."
        />

        {formError ? (
          <AuthAlert message={formError} />
        ) : null}

        <form
          className="space-y-4 sm:space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="First name"
              htmlFor="first_name"
              error={errors.first_name}
            >
              <Input
                id="first_name"
                autoComplete="given-name"
                value={values.first_name}
                disabled={submitting}
                onChange={(event) =>
                  setField(
                    "first_name",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label="Last name"
              htmlFor="last_name"
              error={errors.last_name}
            >
              <Input
                id="last_name"
                autoComplete="family-name"
                value={values.last_name}
                disabled={submitting}
                onChange={(event) =>
                  setField(
                    "last_name",
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>

          <FormField
            label="Email address"
            htmlFor="register_email"
            error={errors.email}
          >
            <Input
              id="register_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              disabled={submitting}
              onChange={(event) =>
                setField("email", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Phone number"
            htmlFor="phone"
            error={errors.phone}
          >
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+234 801 234 5678"
              value={values.phone}
              disabled={submitting}
              onChange={(event) =>
                setField("phone", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="register_password"
            error={errors.password}
          >
            <PasswordInput
              id="register_password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={values.password}
              disabled={submitting}
              onChange={(event) =>
                setField("password", event.target.value)
              }
            />
          </FormField>

          <PasswordRequirements
            password={values.password}
          />

          <FormField
            label="Confirm password"
            htmlFor="confirm_password"
            error={errors.confirm_password}
          >
            <PasswordInput
              id="confirm_password"
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
            loadingText="Creating account..."
          >
            Create account
          </Button>
        </form>

        <p
          className="text-center text-sm"
          style={{ color: "var(--muted)" }}
        >
          Already have an account?{" "}
          <Link
            to={ROUTES.login}
            className="font-medium"
            style={{ color: "var(--brand-accent)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
