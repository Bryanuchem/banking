import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import {
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { login } from "@/api/auth";
import AdminBrand from "@/components/auth/AdminBrand";
import AdminBrandPanel from "@/components/auth/AdminBrandPanel";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAdminAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";
import {
  setChallengeToken,
  setRememberPreference,
} from "@/utils/storage";

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: {
      status?: number;
      data?: {
        detail?: string;
      };
    };
  };

  if (!candidate.response) {
    return "The administration API could not be reached.";
  }

  if (candidate.response.status === 401) {
    return candidate.response.data?.detail ??
      "Invalid email or password.";
  }

  if (candidate.response.status === 423) {
    return "This administrator account is temporarily locked.";
  }

  return (
    candidate.response.data?.detail ??
    "Unable to sign in right now."
  );
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { establishSession } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [remember, setRemember] =
    useState(true);
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function submit(
    event: React.FormEvent,
  ) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login({
        email,
        password,
        remember_me: remember,
      });

      if (
        result.two_factor_required &&
        result.challenge_token
      ) {
        setChallengeToken(
          result.challenge_token,
        );
        setRememberPreference(remember);
        navigate(ROUTES.twoFactor, {
          replace: true,
        });
        return;
      }

      if (!result.access_token) {
        throw new Error(
          "Authentication did not return an access token.",
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

      const from =
        (
          location.state as {
            from?: {
              pathname?: string;
            };
          } | null
        )?.from?.pathname ?? ROUTES.dashboard;

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="
        relative min-h-screen
        lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]
        xl:grid-cols-[minmax(0,1fr)_minmax(580px,1fr)]
      "
      style={{ background: "var(--bg)" }}
    >
      <div
        className="
          fixed right-4 top-4 z-[70]
          sm:right-6 sm:top-6
          lg:right-6 lg:top-6
          xl:right-8 xl:top-8
        "
      >
        <ThemeToggle />
      </div>

      <AdminBrandPanel />

      <section
        className="
          relative min-h-screen px-4 pb-8 pt-20
          sm:px-6 sm:pb-10 sm:pt-24
          md:px-8
          lg:grid lg:place-items-center lg:px-10 lg:py-12
          xl:px-14
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-x-0 top-0
            hidden h-72 md:block lg:hidden
          "
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--brand-accent) 7%, var(--surface)) 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-md lg:mx-0">
          <div className="mb-8 lg:hidden">
            <AdminBrand />
          </div>

          <div>
            <div
              className="
                mb-3 inline-flex items-center gap-2
                rounded-full border px-3 py-1.5
                text-xs font-medium
              "
              style={{
                color: "var(--brand-accent)",
                borderColor:
                  "color-mix(in srgb, var(--brand-accent) 24%, var(--border))",
                background:
                  "color-mix(in srgb, var(--brand-accent) 7%, transparent)",
              }}
            >
              <LockKeyhole size={13} />
              Secure administrator sign-in
            </div>

            <h1
              className="text-3xl font-semibold tracking-[-0.035em]"
              style={{ color: "var(--text)" }}
            >
              Admin Console
            </h1>

            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--muted)" }}
            >
              Sign in with an administrator account to continue.
            </p>
          </div>

          {error ? (
            <div
              className="mt-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                color: "var(--danger)",
                borderColor:
                  "color-mix(in srgb, var(--danger) 35%, var(--border))",
                background:
                  "color-mix(in srgb, var(--danger) 8%, var(--surface))",
              }}
            >
              {error}
            </div>
          ) : null}

          <form
            className="mt-7 space-y-4"
            onSubmit={submit}
          >
            <label className="block">
              <span
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Email address
              </span>

              <Input
                type="email"
                autoComplete="username"
                value={email}
                required
                placeholder="admin@example.com"
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </label>

            <label className="block">
              <span
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Password
              </span>

              <div className="relative">
                <Input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={password}
                  required
                  className="pr-11"
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) =>
                  setRemember(
                    event.target.checked,
                  )
                }
              />
              Keep me signed in on this device
            </label>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Sign in to admin
            </Button>
          </form>

          <div
            className="
              mt-7 flex items-center justify-center gap-2
              border-t pt-5 text-xs
            "
            style={{
              color: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <LockKeyhole size={13} />
            Protected administrative access
          </div>
        </div>
      </section>
    </main>
  );
}
