import {
  ArrowLeft,
  Copy,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import {
  useState,
} from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import OtpInput from "@/components/auth/OtpInput";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CopyButton from "@/components/common/CopyButton";
import FormField from "@/components/common/FormField";
import Input from "@/components/common/Input";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  useBeginTwoFactorSetup,
  useConfirmTwoFactorSetup,
  useDisableTwoFactor,
  useRegenerateRecoveryCodes,
  useTwoFactorStatus,
} from "@/hooks/useProfileSecurity";

export default function TwoFactorPage() {
  const statusQ = useTwoFactorStatus();
  const beginM = useBeginTwoFactorSetup();
  const confirmM = useConfirmTwoFactorSetup();
  const disableM = useDisableTwoFactor();
  const regenerateM =
    useRegenerateRecoveryCodes();
  const snackbar = useSnackbar();

  const [setup, setSetup] = useState<{
    secret: string;
    provisioning_uri: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] =
    useState<string[]>([]);
  const [disableOpen, setDisableOpen] =
    useState(false);
  const [regenOpen, setRegenOpen] =
    useState(false);

  async function startSetup() {
    try {
      setSetup(await beginM.mutateAsync());
      setCode("");
    } catch {
      snackbar.error(
        "We couldn't start 2FA setup.",
      );
    }
  }

  async function confirmSetup() {
    try {
      const result =
        await confirmM.mutateAsync(code);
      setRecoveryCodes(
        result.recovery_codes,
      );
      setSetup(null);
      setCode("");
      snackbar.success(
        "Two-factor authentication enabled.",
      );
    } catch {
      snackbar.error(
        "The authenticator code was not accepted.",
      );
    }
  }

  async function disable() {
    try {
      await disableM.mutateAsync(code);
      setCode("");
      setDisableOpen(false);
      snackbar.success(
        "Two-factor authentication disabled.",
      );
    } catch {
      snackbar.error(
        "We couldn't disable two-factor authentication.",
      );
    }
  }

  async function regenerate() {
    try {
      const result =
        await regenerateM.mutateAsync(code);
      setRecoveryCodes(
        result.recovery_codes,
      );
      setCode("");
      setRegenOpen(false);
      snackbar.success(
        "New recovery codes generated.",
      );
    } catch {
      snackbar.error(
        "We couldn't generate new recovery codes.",
      );
    }
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="mx-auto max-w-xl">
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          Save your recovery codes
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--muted)" }}
        >
          These codes are shown only now. Store them somewhere secure.
        </p>

        <div
          className="mt-6 rounded-[var(--radius-card)] border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((item) => (
              <code
                key={item}
                className="rounded-lg p-3 text-center text-sm"
                style={{
                  color: "var(--text)",
                  background: "var(--surface-alt)",
                }}
              >
                {item}
              </code>
            ))}
          </div>

          <Button
            className="mt-5 w-full"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                recoveryCodes.join("\n"),
              );
              snackbar.success(
                "Recovery codes copied.",
              );
            }}
          >
            Copy all codes
          </Button>

          <Button
            className="mt-2 w-full"
            onClick={() =>
              setRecoveryCodes([])
            }
          >
            I've saved these codes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/security"
        className="mb-5 inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={17} />
        Security
      </Link>

      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--text)" }}
      >
        Two-factor authentication
      </h1>

      <div
        className="mt-6 rounded-[var(--radius-card)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {statusQ.data?.enabled ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className="grid size-11 place-items-center rounded-xl"
                style={{
                  color: "var(--success)",
                  background:
                    "color-mix(in srgb, var(--success) 10%, var(--surface))",
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Enabled
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  {statusQ.data.recovery_codes_remaining} recovery codes remaining
                </p>
              </div>
            </div>

            <div className="mt-5">
              <FormField
                label="Authenticator or recovery code"
                htmlFor="security-code"
              >
                <Input
                  id="security-code"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  placeholder="Enter code"
                />
              </FormField>
            </div>

            <Button
              className="mt-4 w-full"
              variant="secondary"
              disabled={!code.trim()}
              onClick={() =>
                setRegenOpen(true)
              }
            >
              Generate new recovery codes
            </Button>

            <Button
              className="mt-2 w-full"
              variant="danger"
              disabled={!code.trim()}
              onClick={() =>
                setDisableOpen(true)
              }
            >
              Disable 2FA
            </Button>
          </>
        ) : setup ? (
          <>
            <p
              className="font-medium"
              style={{ color: "var(--text)" }}
            >
              Scan this QR code
            </p>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--muted)" }}
            >
              Open your authenticator app and scan the code below.
            </p>

            <div className="mt-5 flex justify-center">
              <div
                className="rounded-2xl border p-4"
                style={{
                  background: "#ffffff",
                  borderColor: "var(--border)",
                }}
              >
                <QRCodeSVG
                  value={setup.provisioning_uri}
                  size={196}
                  level="M"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#000000"
                  title="Two-factor authentication setup QR code"
                />
              </div>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div
                className="h-px flex-1"
                style={{ background: "var(--border)" }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                Can't scan?
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "var(--border)" }}
              />
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--surface-alt)",
              }}
            >
              <p
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                Secret key
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <code
                  className="break-all text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {setup.secret}
                </code>
                <CopyButton
                  value={setup.secret}
                  label="Copy"
                />
              </div>
            </div>

            <div className="mt-5">
              <p
                className="mb-3 text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Enter the 6-digit code
              </p>
              <OtpInput
                value={code}
                onChange={setCode}
                disabled={confirmM.isPending}
              />
            </div>

            <Button
              className="mt-5 w-full"
              disabled={code.length !== 6}
              loading={confirmM.isPending}
              onClick={() =>
                void confirmSetup()
              }
            >
              Enable two-factor authentication
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div
                className="grid size-11 place-items-center rounded-xl"
                style={{
                  color: "var(--brand-accent)",
                  background: "var(--surface-alt)",
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Authenticator app
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  Not enabled
                </p>
              </div>
            </div>

            <Button
              className="mt-5 w-full"
              loading={beginM.isPending}
              onClick={() => void startSetup()}
            >
              Set up authenticator
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={disableOpen}
        title="Disable two-factor authentication?"
        description="Your account will no longer require authenticator verification for sign-in and sensitive actions."
        confirmLabel="Disable 2FA"
        destructive
        loading={disableM.isPending}
        onConfirm={() => void disable()}
        onCancel={() => setDisableOpen(false)}
      />

      <ConfirmDialog
        open={regenOpen}
        title="Generate new recovery codes?"
        description="Your existing recovery codes will stop working immediately."
        confirmLabel="Generate codes"
        loading={regenerateM.isPending}
        onConfirm={() => void regenerate()}
        onCancel={() => setRegenOpen(false)}
      />
    </div>
  );
}
