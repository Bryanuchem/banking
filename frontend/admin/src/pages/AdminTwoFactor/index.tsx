import {
  ArrowLeft,
  Copy,
  KeyRound,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";
import {
  QRCodeSVG,
} from "qrcode.react";

import {
  beginAdminTwoFactorSetup,
  confirmAdminTwoFactorSetup,
  disableAdminTwoFactor,
  getAdminTwoFactorStatus,
  regenerateAdminRecoveryCodes,
} from "@/api/profile";
import OtpInput from "@/components/auth/OtpInput";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import {
  useSnackbar,
} from "@/context/SnackbarContext";
import {
  ROUTES,
} from "@/routes/paths";

export default function AdminTwoFactorPage() {
  const client = useQueryClient();
  const snackbar = useSnackbar();

  const statusQ = useQuery({
    queryKey: [
      "admin",
      "profile",
      "2fa",
    ],
    queryFn:
      getAdminTwoFactorStatus,
  });

  const beginM = useMutation({
    mutationFn:
      beginAdminTwoFactorSetup,
  });

  const confirmM = useMutation({
    mutationFn:
      confirmAdminTwoFactorSetup,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: [
          "admin",
          "profile",
          "2fa",
        ],
      }),
  });

  const disableM = useMutation({
    mutationFn:
      disableAdminTwoFactor,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: [
          "admin",
          "profile",
          "2fa",
        ],
      }),
  });

  const regenerateM = useMutation({
    mutationFn:
      regenerateAdminRecoveryCodes,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: [
          "admin",
          "profile",
          "2fa",
        ],
      }),
  });

  const [setup, setSetup] =
    useState<{
      secret: string;
      provisioning_uri: string;
    } | null>(null);
  const [code, setCode] =
    useState("");
  const [
    recoveryCodes,
    setRecoveryCodes,
  ] = useState<string[]>([]);
  const [
    disableOpen,
    setDisableOpen,
  ] = useState(false);
  const [
    regenerateOpen,
    setRegenerateOpen,
  ] = useState(false);

  async function startSetup() {
    try {
      setSetup(
        await beginM.mutateAsync(),
      );
      setCode("");
    } catch {
      snackbar.showSnackbar(
        "We couldn't start two-factor setup.",
        "error",
      );
    }
  }

  async function confirmSetup() {
    if (code.trim().length !== 6) {
      snackbar.showSnackbar(
        "Enter the six-digit authenticator code.",
        "warning",
      );
      return;
    }

    try {
      const result =
        await confirmM.mutateAsync(
          code.trim(),
        );
      setRecoveryCodes(
        result.recovery_codes,
      );
      setSetup(null);
      setCode("");
      snackbar.showSnackbar(
        "Two-factor authentication enabled.",
        "success",
      );
    } catch {
      snackbar.showSnackbar(
        "The authenticator code was not accepted.",
        "error",
      );
    }
  }

  async function disable() {
    if (!code.trim()) return;

    try {
      await disableM.mutateAsync(
        code.trim(),
      );
      setCode("");
      setDisableOpen(false);
      snackbar.showSnackbar(
        "Two-factor authentication disabled.",
        "success",
      );
    } catch {
      snackbar.showSnackbar(
        "We couldn't disable two-factor authentication.",
        "error",
      );
    }
  }

  async function regenerate() {
    if (!code.trim()) return;

    try {
      const result =
        await regenerateM.mutateAsync(
          code.trim(),
        );
      setRecoveryCodes(
        result.recovery_codes,
      );
      setCode("");
      setRegenerateOpen(false);
      snackbar.showSnackbar(
        "New recovery codes generated.",
        "success",
      );
    } catch {
      snackbar.showSnackbar(
        "We couldn't generate new recovery codes.",
        "error",
      );
    }
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <Link
          to={ROUTES.profile}
          className="inline-flex items-center gap-2 text-sm"
          style={{
            color: "var(--muted)",
          }}
        >
          <ArrowLeft size={17} />
          Admin profile
        </Link>

        <div>
          <h1
            className="text-2xl font-semibold"
            style={{
              color: "var(--text)",
            }}
          >
            Save your recovery codes
          </h1>
          <p
            className="mt-2 text-sm"
            style={{
              color: "var(--muted)",
            }}
          >
            These codes are shown only now. Store them somewhere secure.
          </p>
        </div>

        <section
          className="rounded-2xl border p-5"
          style={{
            background:
              "var(--surface)",
            borderColor:
              "var(--border)",
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map(
              (item) => (
                <code
                  key={item}
                  className="rounded-lg p-3 text-center text-sm"
                  style={{
                    color:
                      "var(--text)",
                    background:
                      "var(--surface-alt)",
                  }}
                >
                  {item}
                </code>
              ),
            )}
          </div>

          <Button
            className="mt-5 w-full"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                recoveryCodes.join(
                  "\n",
                ),
              );
              snackbar.showSnackbar(
                "Recovery codes copied.",
                "success",
              );
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Copy size={15} />
              Copy all codes
            </span>
          </Button>

          <Button
            className="mt-2 w-full"
            onClick={() =>
              setRecoveryCodes([])
            }
          >
            I've saved these codes
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        to={ROUTES.profile}
        className="inline-flex items-center gap-2 text-sm"
        style={{
          color: "var(--muted)",
        }}
      >
        <ArrowLeft size={17} />
        Admin profile
      </Link>

      <div>
        <h1
          className="text-2xl font-semibold"
          style={{
            color: "var(--text)",
          }}
        >
          Two-factor authentication
        </h1>
        <p
          className="mt-1 text-sm"
          style={{
            color: "var(--muted)",
          }}
        >
          Protect this administrator account with an authenticator app.
        </p>
      </div>

      <section
        className="rounded-2xl border p-5"
        style={{
          background:
            "var(--surface)",
          borderColor:
            "var(--border)",
        }}
      >
        {statusQ.isLoading ? (
          <p
            className="text-sm"
            style={{
              color: "var(--muted)",
            }}
          >
            Loading two-factor status...
          </p>
        ) : statusQ.data?.enabled ? (
          <>
            <div className="flex items-center gap-3">
              <span
                className="grid size-11 place-items-center rounded-xl"
                style={{
                  color:
                    "var(--success)",
                  background:
                    "color-mix(in srgb, var(--success) 10%, var(--surface))",
                }}
              >
                <ShieldCheck
                  size={20}
                />
              </span>

              <div>
                <p
                  className="font-semibold"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  Two-factor authentication is enabled
                </p>
                <p
                  className="text-sm"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  {statusQ.data
                    .recovery_codes_remaining}{" "}
                  recovery codes remaining
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label
                className="mb-2 block text-xs font-medium"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Authenticator or recovery code
              </label>
              <OtpInput
                value={code}
                onChange={setCode}
              />
            </div>

            <Button
              className="mt-4 w-full"
              variant="secondary"
              disabled={!code.trim()}
              onClick={() =>
                setRegenerateOpen(
                  true,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <KeyRound size={15} />
                Generate new recovery codes
              </span>
            </Button>

            <Button
              className="mt-2 w-full"
              variant="danger"
              disabled={!code.trim()}
              onClick={() =>
                setDisableOpen(true)
              }
            >
              <span className="inline-flex items-center gap-2">
                <ShieldOff
                  size={15}
                />
                Disable two-factor authentication
              </span>
            </Button>
          </>
        ) : setup ? (
          <>
            <div
              className="rounded-xl border p-4"
              style={{
                background:
                  "var(--surface-alt)",
                borderColor:
                  "var(--border)",
              }}
            >
              <p
                className="font-semibold"
                style={{
                  color:
                    "var(--text)",
                }}
              >
                Scan this QR code
              </p>
              <p
                className="mt-1 text-sm"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Add this administrator account to your authenticator app.
              </p>

              <div className="mt-4 flex justify-center">
                <div className="rounded-xl bg-white p-4">
                  <QRCodeSVG
                    value={
                      setup.provisioning_uri
                    }
                    size={190}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p
                  className="text-xs font-medium"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  Manual setup key
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code
                    className="min-w-0 flex-1 break-all rounded-lg p-2 text-xs"
                    style={{
                      color:
                        "var(--text)",
                      background:
                        "var(--surface)",
                    }}
                  >
                    {setup.secret}
                  </code>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        setup.secret,
                      );
                      snackbar.showSnackbar(
                        "Setup key copied.",
                        "success",
                      );
                    }}
                  >
                    <Copy size={15} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label
                className="mb-2 block text-xs font-medium"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                Six-digit code
              </label>
              <OtpInput
                value={code}
                onChange={setCode}
              />
            </div>

            <Button
              className="mt-4 w-full"
              loading={
                confirmM.isPending
              }
              disabled={
                code.trim().length !==
                6
              }
              onClick={
                confirmSetup
              }
            >
              Verify and enable
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span
                className="grid size-11 place-items-center rounded-xl"
                style={{
                  color:
                    "var(--warning)",
                  background:
                    "color-mix(in srgb, var(--warning) 10%, var(--surface))",
                }}
              >
                <ShieldOff size={20} />
              </span>
              <div>
                <p
                  className="font-semibold"
                  style={{
                    color:
                      "var(--text)",
                  }}
                >
                  Two-factor authentication is not enabled
                </p>
                <p
                  className="text-sm"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  Set up 2FA for the administrator account you are currently signed in with.
                </p>
              </div>
            </div>

            <Button
              className="mt-5 w-full"
              loading={beginM.isPending}
              onClick={startSetup}
            >
              Set up two-factor authentication
            </Button>
          </>
        )}
      </section>

      <Modal
        open={disableOpen}
        title="Disable two-factor authentication?"
        onClose={() =>
          setDisableOpen(false)
        }
        maxWidth="max-w-md"
      >
        <div className="p-5">
          <p
            className="text-sm leading-6"
            style={{
              color: "var(--muted)",
            }}
          >
            This reduces protection on your administrator account. Continue only if you intend to remove 2FA.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setDisableOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={
                disableM.isPending
              }
              onClick={disable}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={regenerateOpen}
        title="Generate new recovery codes?"
        onClose={() =>
          setRegenerateOpen(false)
        }
        maxWidth="max-w-md"
      >
        <div className="p-5">
          <p
            className="text-sm leading-6"
            style={{
              color: "var(--muted)",
            }}
          >
            Existing recovery codes will no longer be valid after new codes are generated.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setRegenerateOpen(
                  false,
                )
              }
            >
              Cancel
            </Button>
            <Button
              loading={
                regenerateM.isPending
              }
              onClick={regenerate}
            >
              Generate codes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
