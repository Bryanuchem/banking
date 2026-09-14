import {
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  completeTwoFactorLogin,
} from "@/api/auth";
import AdminBrand from "@/components/auth/AdminBrand";
import OtpInput from "@/components/auth/OtpInput";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAdminAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";
import {
  clearChallengeToken,
  clearRememberPreference,
  getChallengeToken,
  getRememberPreference,
} from "@/utils/storage";

export default function AdminTwoFactorPage() {
  const navigate = useNavigate();
  const { establishSession } = useAdminAuth();

  const [code, setCode] = useState("");
  const [recoveryMode, setRecoveryMode] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  const challengeToken =
    getChallengeToken();
  const remember =
    getRememberPreference();

  async function submit() {
    if (!challengeToken) {
      navigate(ROUTES.login, {
        replace: true,
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result =
        await completeTwoFactorLogin({
          challenge_token: challengeToken,
          code: code.trim(),
          remember_me: remember,
        });

      if (!result.access_token) {
        throw new Error(
          "Verification did not return an access token.",
        );
      }

      try {
        await establishSession(
          result.access_token,
          remember,
        );
      } catch (authError) {
        if (
          authError instanceof Error &&
          authError.message ===
            "ADMIN_ACCESS_REQUIRED"
        ) {
          navigate(ROUTES.forbidden, {
            replace: true,
          });
          return;
        }
        throw authError;
      }

      clearChallengeToken();
      clearRememberPreference();

      navigate(ROUTES.dashboard, {
        replace: true,
      });
    } catch (err) {
      const candidate = err as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      };

      setError(
        candidate.response?.data?.detail ??
          "The verification code was not accepted.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative grid min-h-screen place-items-center px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section
        className="w-full max-w-md rounded-[24px] border p-6 shadow-xl sm:p-8"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <AdminBrand />

        <div className="mt-7 text-center">
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Verify your identity
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--muted)" }}
          >
            {recoveryMode
              ? "Enter one of your recovery codes."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        {error ? (
          <div
            className="mt-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              color: "var(--danger)",
              borderColor:
                "color-mix(in srgb, var(--danger) 35%, var(--border))",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          {recoveryMode ? (
            <Input
              value={code}
              autoFocus
              placeholder="Recovery code"
              onChange={(event) =>
                setCode(event.target.value)
              }
            />
          ) : (
            <OtpInput
              value={code}
              onChange={setCode}
              disabled={loading}
            />
          )}
        </div>

        <Button
          className="mt-6 w-full"
          disabled={
            recoveryMode
              ? !code.trim()
              : code.length !== 6
          }
          loading={loading}
          onClick={() => void submit()}
        >
          Verify and continue
        </Button>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm font-medium"
          style={{ color: "var(--brand-accent)" }}
          onClick={() => {
            setRecoveryMode(
              (value) => !value,
            );
            setCode("");
          }}
        >
          {recoveryMode
            ? "Use authenticator code instead"
            : "Use a recovery code instead"}
        </button>

        <Link
          to={ROUTES.login}
          className="mt-6 flex items-center justify-center gap-2 border-t pt-5 text-xs"
          style={{
            color: "var(--muted)",
            borderColor: "var(--border)",
          }}
        >
          <ArrowLeft size={13} />
          Return to sign in
        </Link>

        <div
          className="mt-3 flex items-center justify-center gap-2 text-xs"
          style={{ color: "var(--muted)" }}
        >
          <LockKeyhole size={13} />
          Two-factor authentication required
        </div>
      </section>
    </main>
  );
}
