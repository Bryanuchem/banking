import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { verifyTwoFactor } from "@/api/auth";
import AuthAlert from "@/components/auth/AuthAlert";
import OtpInput from "@/components/auth/OtpInput";
import {
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
} from "@/components/common";
import { useAuthContext } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";
import { getApiErrorMessage } from "@/utils/apiError";

export default function TwoFactorPage() {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<
    "authenticator" | "recovery"
  >("authenticator");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] =
    useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from =
    (
      location.state as
        | { from?: string }
        | null
    )?.from ?? ROUTES.dashboard;

  if (!auth.challengeToken) {
    return <Navigate to={ROUTES.login} replace />;
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (
      mode === "authenticator" &&
      code.length !== 6
    ) {
      setError("Enter the six-digit authentication code.");
      return;
    }

    if (
      mode === "recovery" &&
      !recoveryCode.trim()
    ) {
      setError("Enter a recovery code.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await verifyTwoFactor({
        challenge_token: auth.challengeToken!,
        code:
          mode === "authenticator"
            ? code
            : undefined,
        recovery_code:
          mode === "recovery"
            ? recoveryCode.trim()
            : undefined,
      });

      if (!result.access_token) {
        setError(
          result.message ??
            "Verification could not be completed.",
        );
        return;
      }

      auth.signIn(result.access_token);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          "The code is invalid or has expired.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function back() {
    auth.clearTwoFactor();
  }

  return (
    <Card>
      <div className="space-y-6">
        <PageHeader
          title={
            mode === "authenticator"
              ? "Verify it's you"
              : "Use a recovery code"
          }
          description={
            mode === "authenticator"
              ? "Enter the code from your authenticator app."
              : "Enter one of your recovery codes."
          }
        />

        {error ? <AuthAlert message={error} /> : null}

        <form
          onSubmit={submit}
          className="space-y-5"
        >
          {mode === "authenticator" ? (
            <FormField
              label="Authentication code"
              htmlFor="otp"
            >
              <OtpInput
                value={code}
                onChange={setCode}
                disabled={submitting}
              />
            </FormField>
          ) : (
            <FormField
              label="Recovery code"
              htmlFor="recovery_2fa"
            >
              <Input
                id="recovery_2fa"
                autoComplete="off"
                placeholder="XXXX-XXXX-XXXX"
                value={recoveryCode}
                disabled={submitting}
                onChange={(event) =>
                  setRecoveryCode(event.target.value)
                }
              />
            </FormField>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            loadingText="Verifying..."
          >
            Verify
          </Button>
        </form>

        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            setError("");
            setMode((current) =>
              current === "authenticator"
                ? "recovery"
                : "authenticator",
            );
          }}
          className="block w-full text-center text-sm font-medium disabled:opacity-50"
          style={{ color: "var(--brand-accent)" }}
        >
          {mode === "authenticator"
            ? "Use a recovery code instead"
            : "Use authenticator code instead"}
        </button>

        <Link
          to={ROUTES.login}
          onClick={back}
          className="block text-center text-sm"
          style={{ color: "var(--muted)" }}
        >
          ← Back to sign in
        </Link>
      </div>
    </Card>
  );
}
