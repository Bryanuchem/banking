import {
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import {
  authorizeAdminStepUp,
} from "@/api/admin";
import OtpInput from "@/components/auth/OtpInput";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import {
  type AdminStepUpRequest,
  subscribeAdminStepUp,
} from "@/utils/adminStepUp";
import {
  apiErrorMessage,
} from "@/utils/apiError";

export default function AdminStepUpDialog() {
  const [request, setRequest] =
    useState<AdminStepUpRequest | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeAdminStepUp((next) => {
      setRequest(next);
      setCode("");
      setError("");
      setLoading(false);
    });
  }, []);

  function close() {
    if (loading) return;
    const current = request;
    setRequest(null);
    setCode("");
    setError("");
    current?.reject(
      new Error("ACTION_CANCELLED"),
    );
  }

  async function continueAction() {
    if (!request || loading) return;

    const normalized = code.trim();
    if (
      normalized &&
      normalized.length !== 6
    ) {
      setError(
        "Enter the complete six-digit authentication code.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!normalized) {
        const current = request;
        setRequest(null);
        current.resolve(undefined);
        return;
      }

      const result =
        await authorizeAdminStepUp(
          request.scope,
          normalized,
        );

      const current = request;
      setRequest(null);
      setCode("");
      current.resolve(
        result.authorization_token,
      );
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "The authentication code could not be verified.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={Boolean(request)}
      title="Two-factor verification"
      onClose={close}
      maxWidth="max-w-md"
    >
      <div className="p-5">
        <div
          className="flex gap-3 rounded-xl border p-4"
          style={{
            borderColor:
              "color-mix(in srgb, var(--brand-primary) 30%, var(--border))",
            background: "var(--surface-alt)",
          }}
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{
              color: "var(--brand-accent)",
              background: "var(--surface)",
            }}
          >
            <ShieldCheck size={19} />
          </span>

          <div>
            <p
              className="text-sm font-semibold"
              style={{
                color: "var(--text)",
              }}
            >
              Confirm this sensitive action
            </p>
            <p
              className="mt-1 text-xs leading-5"
              style={{
                color: "var(--muted)",
              }}
            >
              Enter the six-digit code from your authenticator app.
              If two-factor authentication is not enabled on this
              administrator account, leave the code blank and continue.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label
            className="mb-2 block text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Authentication code
          </label>
          <OtpInput
            value={code}
            onChange={(value) => {
              setCode(value);
              setError("");
            }}
            disabled={loading}
          />
        </div>

        {error ? (
          <div
            className="mt-4 rounded-xl border p-3 text-sm"
            style={{
              color: "var(--danger)",
              borderColor:
                "color-mix(in srgb, var(--danger) 35%, var(--border))",
              background:
                "color-mix(in srgb, var(--danger) 6%, var(--surface))",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={loading}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={continueAction}
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
