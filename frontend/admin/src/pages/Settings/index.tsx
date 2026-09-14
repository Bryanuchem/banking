import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Mail,
  Plus,
  Trash2,
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
  useSearchParams,
} from "react-router-dom";
import {
  FaDiscord,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import {
  getAdminProviders,
  getAdminSettings,
  sendAdminTestEmail,
  updateAdminSettings,
} from "@/api/admin";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import StatusBadge from "@/components/common/StatusBadge";
import PublicSitePreview from "@/components/settings/PublicSitePreview";
import SettingsFooter from "@/components/settings/SettingsFooter";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  type Draft,
  sectionKeys,
  settingMap,
  settingsDraft,
  tabs,
  valueBoolean,
  valueString,
} from "@/pages/Settings/settings";
import {
  providerSettingsPath,
} from "@/routes/paths";
import { apiErrorMessage } from "@/utils/apiError";

const PUBLIC_SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL ??
  "http://localhost:5173";

const socialFields = [
  ["Facebook", "social_facebook_url", FaFacebookF],
  ["Instagram", "social_instagram_url", FaInstagram],
  ["X (Twitter)", "social_x_url", FaXTwitter],
  ["LinkedIn", "social_linkedin_url", FaLinkedinIn],
  ["YouTube", "social_youtube_url", FaYoutube],
  ["TikTok", "social_tiktok_url", FaTiktok],
  ["Discord", "social_discord_url", FaDiscord],
] as const;

export default function AdminSettingsPage() {
  const snackbar = useSnackbar();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") ?? "branding";
  const active = tabs.some(
    ([value]) => value === requested,
  )
    ? requested
    : "branding";

  const settingsQ = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettings,
  });

  const providersQ = useQuery({
    queryKey: ["admin", "settings", "providers"],
    queryFn: getAdminProviders,
  });

  const [draft, setDraft] = useState<Draft>({});
  const [baseline, setBaseline] = useState<Draft>({});
  const [testRecipient, setTestRecipient] =
    useState("");
  const [newOrigin, setNewOrigin] = useState("");

  useEffect(() => {
    if (!settingsQ.data) return;
    const next = settingsDraft(settingsQ.data);
    setDraft(next);
    setBaseline(next);
  }, [settingsQ.data]);

  const metadata = useMemo(
    () => settingMap(settingsQ.data ?? []),
    [settingsQ.data],
  );

  const currentKeys =
    active === "payments"
      ? []
      : sectionKeys[active] ?? [];

  const dirty = currentKeys.some((key) => {
    return (
      JSON.stringify(draft[key]) !==
      JSON.stringify(baseline[key])
    );
  });

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = currentKeys
        .filter((key) => {
          const item = metadata.get(key);
          if (
            item?.is_secret &&
            !String(draft[key] ?? "").trim()
          ) {
            return false;
          }
          return (
            JSON.stringify(draft[key]) !==
            JSON.stringify(baseline[key])
          );
        })
        .map((key) => ({
          key,
          value: draft[key],
        }));

      if (
        active === "smtp" &&
        valueBoolean(draft, "smtp_use_tls") &&
        valueBoolean(draft, "smtp_use_ssl")
      ) {
        throw new Error(
          "Use either TLS or SSL, not both.",
        );
      }

      if (active === "rules") {
        const oldFee =
          baseline.withdrawal_fee_percent;
        const newFee =
          draft.withdrawal_fee_percent;
        if (
          oldFee !== newFee &&
          !window.confirm(
            `Change withdrawal fee from ${oldFee}% to ${newFee}%? This affects newly calculated withdrawal fees only.`,
          )
        ) {
          throw new Error("SAVE_CANCELLED");
        }
      }

      if (!updates.length) return null;
      return updateAdminSettings(updates);
    },
    onSuccess: async (result) => {
      if (!result) return;

      const labels: Record<string, string> = {
        branding: "Branding settings saved.",
        landing: "Landing settings saved.",
        support:
          "Support and social settings saved.",
        smtp: "SMTP configuration updated.",
        rules: "Platform rules updated.",
      };

      snackbar.showSnackbar(
        labels[active] ?? "Settings updated.",
        "success",
      );

      await client.invalidateQueries({
        queryKey: ["admin", "settings"],
      });
    },
    onError: (error) => {
      if (
        error instanceof Error &&
        error.message === "SAVE_CANCELLED"
      ) {
        return;
      }
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          error instanceof Error
            ? error.message
            : "Settings could not be saved.",
        ),
        "error",
      );
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () =>
      sendAdminTestEmail(testRecipient.trim()),
    onSuccess: () => {
      snackbar.showSnackbar(
        "Test email sent successfully.",
        "success",
      );
    },
    onError: (error) => {
      snackbar.showSnackbar(
        apiErrorMessage(
          error,
          "Test email could not be sent.",
        ),
        "error",
      );
    },
  });

  function setValue(
    key: string,
    value: unknown,
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function changeTab(next: string) {
    if (
      dirty &&
      !window.confirm(
        "Discard your unsaved changes?",
      )
    ) {
      return;
    }
    setParams({ tab: next });
  }

  function reset() {
    setDraft((current) => {
      const next = { ...current };
      for (const key of currentKeys) {
        next[key] = baseline[key];
      }
      return next;
    });
  }

  if (settingsQ.isLoading) {
    return (
      <div
        className="p-8 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Loading settings...
      </div>
    );
  }

  if (settingsQ.isError) {
    return (
      <div
        className="rounded-xl border p-6 text-sm"
        style={{
          color: "var(--danger)",
          borderColor: "var(--border)",
        }}
      >
        Settings could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-[-0.03em]"
            style={{ color: "var(--text)" }}
          >
            Settings
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Configure your banking platform.
          </p>
        </div>

        <a
          href={PUBLIC_SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold"
          style={{
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          View public site
          <ExternalLink size={14} />
        </a>
      </header>

      <SettingsTabs
        active={active}
        onChange={changeTab}
      />

      {active === "branding" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <SettingsCard
            title="Brand information"
            description="This information is used across your platform and public site."
          >
            <Field
              label="Bank name"
              value={valueString(
                draft,
                "brand_name",
              )}
              onChange={(value) =>
                setValue("brand_name", value)
              }
            />
            <Field
              label="Short name"
              value={valueString(
                draft,
                "brand_short_name",
              )}
              onChange={(value) =>
                setValue(
                  "brand_short_name",
                  value,
                )
              }
            />
            <Field
              label="Tagline"
              value={valueString(
                draft,
                "brand_tagline",
              )}
              onChange={(value) =>
                setValue("brand_tagline", value)
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Logo URL"
                value={valueString(
                  draft,
                  "logo_url",
                )}
                placeholder="https://..."
                onChange={(value) =>
                  setValue("logo_url", value)
                }
              />
              <Field
                label="Favicon URL"
                value={valueString(
                  draft,
                  "favicon_url",
                )}
                placeholder="https://..."
                onChange={(value) =>
                  setValue("favicon_url", value)
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ColorField
                label="Primary color"
                value={valueString(
                  draft,
                  "brand_light_primary_color",
                )}
                onChange={(value) =>
                  setValue(
                    "brand_light_primary_color",
                    value,
                  )
                }
              />
              <ColorField
                label="Secondary color"
                value={valueString(
                  draft,
                  "brand_light_secondary_color",
                )}
                onChange={(value) =>
                  setValue(
                    "brand_light_secondary_color",
                    value,
                  )
                }
              />
              <ColorField
                label="Accent color"
                value={valueString(
                  draft,
                  "brand_light_accent_color",
                )}
                onChange={(value) =>
                  setValue(
                    "brand_light_accent_color",
                    value,
                  )
                }
              />
            </div>
          </SettingsCard>

          <PublicSitePreview
            draft={draft}
            mode="branding"
          />
        </div>
      ) : null}

      {active === "landing" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <SettingsCard
            title="Landing page"
            description="Edit the public hero and feature content. Preview updates locally before saving."
          >
            <Field
              label="Eyebrow"
              value={valueString(
                draft,
                "landing_eyebrow",
              )}
              onChange={(value) =>
                setValue(
                  "landing_eyebrow",
                  value,
                )
              }
            />
            <Field
              label="Headline"
              value={valueString(
                draft,
                "landing_title",
              )}
              onChange={(value) =>
                setValue("landing_title", value)
              }
            />
            <TextAreaField
              label="Description"
              value={valueString(
                draft,
                "landing_description",
              )}
              onChange={(value) =>
                setValue(
                  "landing_description",
                  value,
                )
              }
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Primary CTA"
                value={valueString(
                  draft,
                  "landing_primary_cta_label",
                )}
                onChange={(value) =>
                  setValue(
                    "landing_primary_cta_label",
                    value,
                  )
                }
              />
              <Field
                label="Secondary CTA"
                value={valueString(
                  draft,
                  "landing_secondary_cta_label",
                )}
                onChange={(value) =>
                  setValue(
                    "landing_secondary_cta_label",
                    value,
                  )
                }
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {[1, 2, 3].map((number) => (
                <div
                  key={number}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--border)",
                    background:
                      "var(--surface-alt)",
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{
                      color:
                        "var(--brand-accent)",
                    }}
                  >
                    Feature {number}
                  </p>
                  <div className="mt-3 space-y-3">
                    <Field
                      label="Title"
                      value={valueString(
                        draft,
                        `landing_feature_${number}_title`,
                      )}
                      onChange={(value) =>
                        setValue(
                          `landing_feature_${number}_title`,
                          value,
                        )
                      }
                    />
                    <TextAreaField
                      label="Description"
                      value={valueString(
                        draft,
                        `landing_feature_${number}_description`,
                      )}
                      onChange={(value) =>
                        setValue(
                          `landing_feature_${number}_description`,
                          value,
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </SettingsCard>

          <PublicSitePreview
            draft={draft}
            mode="landing"
          />
        </div>
      ) : null}

      {active === "support" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsCard
              title="Support information"
              description="Empty values are hidden from the public experience."
            >
              <Field
                label="Support email"
                value={valueString(
                  draft,
                  "support_email",
                )}
                onChange={(value) =>
                  setValue(
                    "support_email",
                    value,
                  )
                }
              />
              <Field
                label="Support phone"
                value={valueString(
                  draft,
                  "support_phone",
                )}
                onChange={(value) =>
                  setValue(
                    "support_phone",
                    value,
                  )
                }
              />
              <IconField
                icon={FaWhatsapp}
                label="WhatsApp URL"
                value={valueString(
                  draft,
                  "support_whatsapp_url",
                )}
                onChange={(value) =>
                  setValue(
                    "support_whatsapp_url",
                    value,
                  )
                }
              />
              <IconField
                icon={FaTelegram}
                label="Telegram URL"
                value={valueString(
                  draft,
                  "support_telegram_url",
                )}
                onChange={(value) =>
                  setValue(
                    "support_telegram_url",
                    value,
                  )
                }
              />
              <Field
                label="Support hours"
                value={valueString(
                  draft,
                  "support_hours",
                )}
                onChange={(value) =>
                  setValue(
                    "support_hours",
                    value,
                  )
                }
              />
            </SettingsCard>

            <SettingsCard
              title="Social media links"
              description="Only populated channels appear publicly."
            >
              {socialFields.map(
                ([label, key, Icon]) => (
                  <IconField
                    key={key}
                    icon={Icon}
                    label={label}
                    value={valueString(
                      draft,
                      key,
                    )}
                    placeholder="https://..."
                    onChange={(value) =>
                      setValue(key, value)
                    }
                  />
                ),
              )}
            </SettingsCard>
          </div>

          <PublicSitePreview
            draft={draft}
            mode="support"
          />
        </div>
      ) : null}

      {active === "payments" ? (
        <SettingsCard
          title="Payment providers"
          description="Configure provider credentials. Sensitive values remain masked and are never returned to the browser."
        >
          {providersQ.isLoading ? (
            <p
              className="text-sm"
              style={{ color: "var(--muted)" }}
            >
              Loading providers...
            </p>
          ) : (
            <div className="space-y-2">
              {providersQ.data?.map(
                (provider) => (
                  <Link
                    key={provider.provider}
                    to={providerSettingsPath(
                      provider.provider,
                    )}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4 transition"
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--surface-alt)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-10 place-items-center rounded-xl text-sm font-bold"
                        style={{
                          background:
                            "var(--surface)",
                          color:
                            "var(--brand-accent)",
                        }}
                      >
                        {provider.label
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div>
                        <p
                          className="font-semibold"
                          style={{
                            color: "var(--text)",
                          }}
                        >
                          {provider.label}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{
                            color:
                              "var(--muted)",
                          }}
                        >
                          {provider.configured_fields}/
                          {provider.required_fields} required fields configured
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge
                        label={
                          provider.configured
                            ? "Configured"
                            : "Not configured"
                        }
                        tone={
                          provider.configured
                            ? "success"
                            : "warning"
                        }
                      />
                      <span
                        className="hidden text-xs font-semibold sm:inline"
                        style={{
                          color:
                            "var(--brand-accent)",
                        }}
                      >
                        Configure
                      </span>
                      <ChevronRight
                        size={17}
                        style={{
                          color:
                            "var(--muted)",
                        }}
                      />
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}
        </SettingsCard>
      ) : null}

      {active === "smtp" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <SettingsCard
            title="SMTP configuration"
            description="Configure notification and authentication email delivery."
          >
            <Toggle
              label="SMTP enabled"
              checked={valueBoolean(
                draft,
                "smtp_enabled",
              )}
              onChange={(value) =>
                setValue(
                  "smtp_enabled",
                  value,
                )
              }
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <Field
                label="SMTP host"
                value={valueString(
                  draft,
                  "smtp_host",
                )}
                onChange={(value) =>
                  setValue("smtp_host", value)
                }
              />
              <Field
                label="SMTP port"
                value={valueString(
                  draft,
                  "smtp_port",
                )}
                onChange={(value) =>
                  setValue(
                    "smtp_port",
                    Number(value),
                  )
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Username"
                value={valueString(
                  draft,
                  "smtp_username",
                )}
                onChange={(value) =>
                  setValue(
                    "smtp_username",
                    value,
                  )
                }
              />
              <Field
                label="Password"
                type="password"
                value={valueString(
                  draft,
                  "smtp_password",
                )}
                placeholder={
                  metadata.get("smtp_password")
                    ?.configured
                    ? "Configured. Enter new value to replace."
                    : "Enter SMTP password"
                }
                onChange={(value) =>
                  setValue(
                    "smtp_password",
                    value,
                  )
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="From email"
                value={valueString(
                  draft,
                  "smtp_from_email",
                )}
                onChange={(value) =>
                  setValue(
                    "smtp_from_email",
                    value,
                  )
                }
              />
              <Field
                label="From name"
                value={valueString(
                  draft,
                  "smtp_from_name",
                )}
                onChange={(value) =>
                  setValue(
                    "smtp_from_name",
                    value,
                  )
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Use TLS"
                checked={valueBoolean(
                  draft,
                  "smtp_use_tls",
                )}
                onChange={(value) => {
                  setValue(
                    "smtp_use_tls",
                    value,
                  );
                  if (value) {
                    setValue(
                      "smtp_use_ssl",
                      false,
                    );
                  }
                }}
              />
              <Toggle
                label="Use SSL"
                checked={valueBoolean(
                  draft,
                  "smtp_use_ssl",
                )}
                onChange={(value) => {
                  setValue(
                    "smtp_use_ssl",
                    value,
                  );
                  if (value) {
                    setValue(
                      "smtp_use_tls",
                      false,
                    );
                  }
                }}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="Test email"
            description="Tests the saved SMTP configuration."
          >
            <div
              className="flex gap-3 rounded-xl border p-4"
              style={{
                borderColor: "var(--border)",
                background:
                  "var(--surface-alt)",
              }}
            >
              <Mail
                size={18}
                className="mt-0.5 shrink-0"
                style={{
                  color:
                    "var(--brand-accent)",
                }}
              />
              <p
                className="text-xs leading-5"
                style={{
                  color: "var(--muted)",
                }}
              >
                Save SMTP changes first, then send a test using the stored configuration.
              </p>
            </div>

            <Field
              label="Recipient email"
              value={testRecipient}
              placeholder="admin@example.com"
              onChange={setTestRecipient}
            />

            <Button
              className="w-full"
              disabled={
                !testRecipient.trim() ||
                dirty
              }
              loading={
                testEmailMutation.isPending
              }
              onClick={() =>
                testEmailMutation.mutate()
              }
            >
              Send test email
            </Button>

            {!dirty &&
            metadata.get("smtp_enabled")
              ?.value ? (
              <div
                className="flex items-center gap-2 rounded-xl border p-3 text-xs"
                style={{
                  color: "var(--success)",
                  borderColor:
                    "color-mix(in srgb, var(--success) 30%, var(--border))",
                }}
              >
                <CheckCircle2 size={15} />
                Saved SMTP configuration is ready to test.
              </div>
            ) : null}
          </SettingsCard>
        </div>
      ) : null}

      {active === "rules" ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <SettingsCard
              title="Operational settings"
              description="Configure real product rules and limits."
            >
              <Field
                label="Withdrawal fee percentage"
                value={valueString(
                  draft,
                  "withdrawal_fee_percent",
                )}
                suffix="%"
                onChange={(value) =>
                  setValue(
                    "withdrawal_fee_percent",
                    value,
                  )
                }
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Registration enabled"
                  checked={valueBoolean(
                    draft,
                    "registration_enabled",
                  )}
                  onChange={(value) =>
                    setValue(
                      "registration_enabled",
                      value,
                    )
                  }
                />
                <Toggle
                  label="Email verification required"
                  checked={valueBoolean(
                    draft,
                    "email_verification_required",
                  )}
                  onChange={(value) =>
                    setValue(
                      "email_verification_required",
                      value,
                    )
                  }
                />
              </div>
            </SettingsCard>

            <SettingsCard
              title="Password policy"
              description="Requirements applied when customers and administrators create or change passwords."
            >
              <Field
                label="Minimum password length"
                type="number"
                value={valueString(
                  draft,
                  "password_min_length",
                )}
                onChange={(value) =>
                  setValue(
                    "password_min_length",
                    value,
                  )
                }
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Require uppercase letters"
                  checked={valueBoolean(
                    draft,
                    "require_uppercase",
                  )}
                  onChange={(value) =>
                    setValue(
                      "require_uppercase",
                      value,
                    )
                  }
                />
                <Toggle
                  label="Require numbers"
                  checked={valueBoolean(
                    draft,
                    "require_numbers",
                  )}
                  onChange={(value) =>
                    setValue(
                      "require_numbers",
                      value,
                    )
                  }
                />
                <Toggle
                  label="Require special characters"
                  checked={valueBoolean(
                    draft,
                    "require_special_characters",
                  )}
                  onChange={(value) =>
                    setValue(
                      "require_special_characters",
                      value,
                    )
                  }
                />
              </div>

              <p
                className="text-xs leading-5"
                style={{ color: "var(--muted)" }}
              >
                Minimum length must be between 8 and 128 characters. Changes apply to new passwords and future password changes.
              </p>
            </SettingsCard>

            <SettingsCard
              title="Allowed application origins"
              description="Browser origins allowed by the DB-backed CORS policy. Development suffix wildcards such as *.trycloudflare.com are supported."
            >
              <div className="space-y-2">
                {(
                  (draft.cors_allowed_origins ??
                    []) as string[]
                ).map((origin) => (
                  <div
                    key={origin}
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--surface-alt)",
                    }}
                  >
                    <span
                      className="min-w-0 truncate font-mono text-xs"
                      style={{
                        color: "var(--text)",
                      }}
                    >
                      {origin}
                    </span>
                    <button
                      type="button"
                      className="grid size-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        color:
                          "var(--danger)",
                      }}
                      onClick={() =>
                        setValue(
                          "cors_allowed_origins",
                          (
                            (draft.cors_allowed_origins ??
                              []) as string[]
                          ).filter(
                            (item) =>
                              item !== origin,
                          ),
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newOrigin}
                  placeholder="https://app.example.com or *.trycloudflare.com"
                  onChange={(event) =>
                    setNewOrigin(
                      event.target.value,
                    )
                  }
                />
                <Button
                  variant="secondary"
                  disabled={!newOrigin.trim()}
                  onClick={() => {
                    const next =
                      newOrigin.trim();
                    const current =
                      (draft.cors_allowed_origins ??
                        []) as string[];
                    if (
                      !current.includes(next)
                    ) {
                      setValue(
                        "cors_allowed_origins",
                        [...current, next],
                      );
                    }
                    setNewOrigin("");
                  }}
                >
                  <Plus size={15} />
                  Add origin
                </Button>
              </div>
            </SettingsCard>
          </div>

          <SettingsCard
            title="Important"
            description="Changes to platform rules may affect customer transactions."
          >
            <div
              className="rounded-xl border p-4 text-sm leading-6"
              style={{
                color: "var(--warning)",
                borderColor:
                  "color-mix(in srgb, var(--warning) 30%, var(--border))",
                background:
                  "var(--surface-alt)",
              }}
            >
              Review values before saving. Withdrawal fee changes apply to newly calculated withdrawals only. Password policy changes apply to new or changed passwords. CORS changes take effect through the runtime policy cache without restarting the API.
            </div>
          </SettingsCard>
        </div>
      ) : null}

      {active !== "payments" ? (
        <SettingsFooter
          dirty={dirty}
          saving={saveMutation.isPending}
          onReset={reset}
          onSave={() =>
            saveMutation.mutate()
          }
        />
      ) : null}
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[var(--radius-card)] border p-5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <h2
        className="font-semibold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h2>
      <p
        className="mt-1 text-xs"
        style={{ color: "var(--muted)" }}
      >
        {description}
      </p>
      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-medium"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
          style={{
            color: "var(--text)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
        {suffix ? (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
            style={{ color: "var(--muted)" }}
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}


function IconField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{
    size?: number;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 flex items-center gap-2 text-xs font-medium"
        style={{ color: "var(--muted)" }}
      >
        <Icon size={14} aria-hidden="true" />
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
        style={{
          color: "var(--text)",
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-medium"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <textarea
        value={value}
        rows={3}
        className="w-full resize-none rounded-xl border p-3 text-sm outline-none"
        style={{
          color: "var(--text)",
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-medium"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <div
        className="flex h-11 items-center gap-2 rounded-xl border px-2"
        style={{
          borderColor: "var(--border)",
        }}
      >
        <input
          type="color"
          value={
            /^#[0-9a-f]{6}$/i.test(value)
              ? value
              : "#2563EB"
          }
          className="size-7 rounded border-0 bg-transparent p-0"
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
        <input
          value={value}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
          style={{ color: "var(--text)" }}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-alt)",
      }}
      onClick={() => onChange(!checked)}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--text)" }}
      >
        {label}
      </span>
      <span
        className="relative h-6 w-11 rounded-full transition"
        style={{
          background: checked
            ? "var(--brand-primary)"
            : "var(--border)",
        }}
      >
        <span
          className="absolute top-1 size-4 rounded-full bg-white transition"
          style={{
            left: checked ? "24px" : "4px",
          }}
        />
      </span>
    </button>
  );
}
