import { LockKeyhole } from "lucide-react";
import { useState } from "react";

import OtpInput from "@/components/auth/OtpInput";
import {
  Button,
  FormField,
  Input,
} from "@/components/common";

type Props = {
  submitting: boolean;
  error?: string;
  onVerify: (code: string) => void;
  onCancel: () => void;
};

export default function WithdrawalStepUp({
  submitting,
  error,
  onVerify,
  onCancel,
}: Props) {
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const valid = recovery
    ? code.trim().length >= 6
    : code.length === 6;

  return (
    <div className="mx-auto max-w-md text-center">
      <div
        className="mx-auto grid size-12 place-items-center rounded-2xl"
        style={{
          color: "var(--brand-accent)",
          background:
            "color-mix(in srgb, var(--brand-accent) 10%, var(--surface))",
        }}
      >
        <LockKeyhole size={21} />
      </div>

      <h1
        className="mt-4 text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        Verify fee payment
      </h1>
      <p
        className="mx-auto mt-2 max-w-sm text-sm leading-6"
        style={{ color: "var(--muted)" }}
      >
        Enter your authenticator code to continue to the payment provider.
      </p>

      <div className="mt-6 text-left">
        {recovery ? (
          <FormField
            label="Recovery code"
            htmlFor="withdrawal-recovery"
          >
            <Input
              id="withdrawal-recovery"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              disabled={submitting}
              placeholder="Enter a recovery code"
              autoFocus
            />
          </FormField>
        ) : (
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={submitting}
          />
        )}

        {error ? (
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--danger)" }}
          >
            {error}
          </p>
        ) : null}
      </div>

      <Button
        className="mt-5 w-full"
        disabled={!valid}
        loading={submitting}
        loadingText="Verifying…"
        onClick={() => onVerify(code.trim())}
      >
        Verify and continue
      </Button>

      <button
        type="button"
        className="mt-4 text-sm font-medium"
        style={{ color: "var(--brand-accent)" }}
        onClick={() => {
          setRecovery((value) => !value);
          setCode("");
        }}
      >
        {recovery
          ? "Use authenticator code instead"
          : "Use recovery code instead"}
      </button>

      <div>
        <button
          type="button"
          disabled={submitting}
          onClick={onCancel}
          className="mt-5 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Back to fee payment
        </button>
      </div>
    </div>
  );
}
