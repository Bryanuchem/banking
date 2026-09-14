import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getAdminProvider,
  updateAdminProvider,
} from "@/api/admin";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import SettingsFooter from "@/components/settings/SettingsFooter";
import { useSnackbar } from "@/context/SnackbarContext";
import { ROUTES } from "@/routes/paths";
import { apiErrorMessage } from "@/utils/apiError";

const labels: Record<string, string> = {
  paystack_public_key: "Public key",
  paystack_secret_key: "Secret key",
  paystack_callback_url: "Callback URL",
  stripe_secret_key: "Secret key",
  stripe_webhook_secret: "Webhook secret",
  stripe_success_url: "Success URL",
  stripe_cancel_url: "Cancel URL",
  stripe_callback_url: "Callback URL",
  paypal_environment: "Environment",
  paypal_client_id: "Client ID",
  paypal_client_secret: "Client secret",
  paypal_webhook_id: "Webhook ID",
  paypal_return_url: "Return URL",
  paypal_cancel_url: "Cancel URL",
  cashapp_environment: "Environment",
  cashapp_client_id: "Client ID",
  cashapp_api_key_id: "API key ID",
  cashapp_api_secret: "API secret",
  cashapp_merchant_id: "Merchant ID",
  cashapp_region: "Region",
  cashapp_redirect_url: "Redirect URL",
};

export default function AdminProviderSettingsPage() {
  const { provider = "" } = useParams();
  const snackbar = useSnackbar();
  const client = useQueryClient();

  const query = useQuery({
    queryKey: [
      "admin",
      "settings",
      "provider",
      provider,
    ],
    queryFn: () =>
      getAdminProvider(provider),
    enabled: Boolean(provider),
  });

  const [draft, setDraft] = useState<
    Record<string, string>
  >({});
  const [baseline, setBaseline] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!query.data) return;
    const next: Record<string, string> = {};
    for (const field of query.data.fields) {
      next[field.key] = field.is_secret
        ? ""
        : String(field.value ?? "");
    }
    setDraft(next);
    setBaseline(next);
  }, [query.data]);

  const dirty = useMemo(() => {
    return Object.keys(draft).some(
      (key) => draft[key] !== baseline[key],
    );
  }, [draft, baseline]);

  useEffect(() => {
    if (!dirty) return;
    const listener = (
      event: BeforeUnloadEvent,
    ) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener(
      "beforeunload",
      listener,
    );
    return () =>
      window.removeEventListener(
        "beforeunload",
        listener,
      );
  }, [dirty]);

  const mutation = useMutation({
    mutationFn: () => {
      const values: Record<string, string> = {};
      for (const field of query.data?.fields ?? []) {
        const value = draft[field.key] ?? "";
        if (
          field.is_secret &&
          !value.trim()
        ) {
          continue;
        }
        if (value !== baseline[field.key]) {
          values[field.key] = value;
        }
      }
      return updateAdminProvider(
        provider,
        values,
      );
    },
    onSuccess: async (result) => {
      snackbar.showSnackbar(
        `${result.label} configuration updated.`,
        "success",
      );
      await Promise.all([
        client.invalidateQueries({
          queryKey: [
            "admin",
            "settings",
            "provider",
            provider,
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "admin",
            "settings",
            "providers",
          ],
        }),
        client.invalidateQueries({
          queryKey: ["admin", "settings"],
        }),
      ]);
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Provider configuration could not be saved.",
        ),
        "error",
      );
    },
  });

  if (query.isLoading) {
    return (
      <div
        className="p-8 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Loading provider configuration...
      </div>
    );
  }

  if (!query.data || query.isError) {
    return (
      <div className="space-y-4">
        <Link
          to={`${ROUTES.settings}?tab=payments`}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{
            color: "var(--brand-accent)",
          }}
        >
          <ArrowLeft size={16} />
          Payment providers
        </Link>
        <div
          className="rounded-xl border p-6 text-sm"
          style={{
            color: "var(--danger)",
            borderColor: "var(--border)",
          }}
        >
          Provider configuration could not be loaded.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to={`${ROUTES.settings}?tab=payments`}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{
          color: "var(--brand-accent)",
        }}
        onClick={(event) => {
          if (
            dirty &&
            !window.confirm(
              "Discard your unsaved provider changes?",
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <ArrowLeft size={16} />
        Payment providers
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 place-items-center rounded-xl"
              style={{
                color: "var(--brand-accent)",
                background: "var(--surface-alt)",
              }}
            >
              <KeyRound size={20} />
            </span>
            <div>
              <h1
                className="text-2xl font-semibold tracking-[-0.03em]"
                style={{ color: "var(--text)" }}
              >
                {query.data.label}
              </h1>
              <p
                className="mt-1 text-sm"
                style={{
                  color: "var(--muted)",
                }}
              >
                Provider configuration
              </p>
            </div>
          </div>
        </div>

        <StatusBadge
          label={
            query.data.configured
              ? "Configured"
              : "Not configured"
          }
          tone={
            query.data.configured
              ? "success"
              : "warning"
          }
        />
      </header>

      <section
        className="rounded-[var(--radius-card)] border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex gap-3 rounded-xl border p-4"
          style={{
            background: "var(--surface-alt)",
            borderColor: "var(--border)",
          }}
        >
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0"
            style={{
              color: "var(--brand-accent)",
            }}
          />
          <p
            className="text-xs leading-5"
            style={{ color: "var(--muted)" }}
          >
            Stored secrets are encrypted and never returned in plaintext. Leave a configured secret blank to keep its existing value.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {query.data.fields.map((field) => (
            <label
              key={field.key}
              className="block"
            >
              <span
                className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium"
                style={{
                  color: "var(--muted)",
                }}
              >
                <span>
                  {labels[field.key] ??
                    field.key}
                </span>
                {field.is_secret &&
                field.configured ? (
                  <span
                    className="text-[10px] uppercase tracking-wide"
                    style={{
                      color:
                        "var(--success)",
                    }}
                  >
                    stored securely
                  </span>
                ) : null}
              </span>
              <input
                type={
                  field.is_secret
                    ? "password"
                    : "text"
                }
                value={
                  draft[field.key] ?? ""
                }
                placeholder={
                  field.is_secret &&
                  field.configured
                    ? "••••••••••••••••"
                    : undefined
                }
                className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
                style={{
                  color: "var(--text)",
                  background:
                    "var(--surface)",
                  borderColor:
                    "var(--border)",
                }}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field.key]:
                      event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      <SettingsFooter
        dirty={dirty}
        saving={mutation.isPending}
        onReset={() =>
          setDraft({ ...baseline })
        }
        onSave={() => mutation.mutate()}
      />
    </div>
  );
}
