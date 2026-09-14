import {
  ArrowRight,
  Headphones,
  Moon,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";
import {
  useState,
} from "react";
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
  type Draft,
  valueString,
} from "@/pages/Settings/settings";

type PreviewTheme = "light" | "dark";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "B"
  );
}

export default function PublicSitePreview({
  draft,
  mode,
}: {
  draft: Draft;
  mode:
    | "branding"
    | "landing"
    | "support";
}) {
  const [previewTheme, setPreviewTheme] =
    useState<PreviewTheme>("light");

  const palette = getPalette(
    draft,
    previewTheme,
  );

  const brand =
    valueString(draft, "brand_name") ||
    "Banking";

  if (mode === "support") {
    const channels = [
      [
        "Email",
        valueString(
          draft,
          "support_email",
        ),
        null,
      ],
      [
        "Phone",
        valueString(
          draft,
          "support_phone",
        ),
        null,
      ],
      [
        "WhatsApp",
        valueString(
          draft,
          "support_whatsapp_url",
        ),
        FaWhatsapp,
      ],
      [
        "Telegram",
        valueString(
          draft,
          "support_telegram_url",
        ),
        FaTelegram,
      ],
      [
        "Hours",
        valueString(
          draft,
          "support_hours",
        ),
        null,
      ],
    ].filter(([, value]) => value);

    const socials = [
      [
        FaFacebookF,
        "social_facebook_url",
        "Facebook",
      ],
      [
        FaInstagram,
        "social_instagram_url",
        "Instagram",
      ],
      [
        FaXTwitter,
        "social_x_url",
        "X",
      ],
      [
        FaLinkedinIn,
        "social_linkedin_url",
        "LinkedIn",
      ],
      [
        FaYoutube,
        "social_youtube_url",
        "YouTube",
      ],
      [
        FaTiktok,
        "social_tiktok_url",
        "TikTok",
      ],
      [
        FaDiscord,
        "social_discord_url",
        "Discord",
      ],
    ].filter(([, key]) =>
      valueString(
        draft,
        String(key),
      ),
    );

    return (
      <PreviewFrame
        title="Live preview"
        theme={previewTheme}
        onThemeChange={setPreviewTheme}
      >
        <div
          className="rounded-xl border p-5 transition-colors"
          style={{
            color: palette.text,
            background:
              palette.surface,
            borderColor:
              palette.border,
          }}
        >
          <Headphones
            size={28}
            className="mb-4"
            style={{
              color: palette.primary,
            }}
          />

          <h3 className="text-xl font-bold">
            Need help?
          </h3>
          <p
            className="mt-1 text-sm"
            style={{
              color: palette.muted,
            }}
          >
            Get in touch with our support team.
          </p>

          <div className="mt-5 space-y-2 text-sm">
            {channels.length ? (
              channels.map(
                ([
                  label,
                  value,
                  Icon,
                ]) => (
                  <div
                    key={String(label)}
                    className="flex items-center gap-2"
                  >
                    {Icon ? (
                      <Icon
                        size={15}
                        aria-hidden="true"
                        style={{
                          color:
                            palette.accent,
                        }}
                      />
                    ) : null}
                    <span>
                      <span className="font-semibold">
                        {String(label)}:
                      </span>{" "}
                      {String(value)}
                    </span>
                  </div>
                ),
              )
            ) : (
              <p
                style={{
                  color: palette.muted,
                }}
              >
                Add support channels to preview them.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {socials.map(
              ([
                Icon,
                key,
                label,
              ]) => (
                <a
                  key={String(key)}
                  href={valueString(
                    draft,
                    String(key),
                  )}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={String(
                    label,
                  )}
                  title={String(label)}
                  className="grid size-9 place-items-center rounded-lg border transition"
                  style={{
                    color:
                      palette.text,
                    borderColor:
                      palette.border,
                    background:
                      palette.surfaceAlt,
                  }}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                  />
                </a>
              ),
            )}
          </div>
        </div>
      </PreviewFrame>
    );
  }

  const title =
    mode === "branding"
      ? valueString(
          draft,
          "brand_tagline",
        ) ||
        "Private banking, clearly managed."
      : valueString(
          draft,
          "landing_title",
        ) ||
        "Your money, clearly managed.";

  const description =
    valueString(
      draft,
      "landing_description",
    ) ||
    "A calm, secure place to manage your banking.";

  const features = [1, 2, 3].map(
    (number) => ({
      title:
        valueString(
          draft,
          `landing_feature_${number}_title`,
        ) ||
        `Feature ${number}`,
      description:
        valueString(
          draft,
          `landing_feature_${number}_description`,
        ) ||
        "Feature description",
    }),
  );

  return (
    <PreviewFrame
      title="Live preview"
      theme={previewTheme}
      onThemeChange={setPreviewTheme}
    >
      <div
        className="overflow-hidden rounded-xl border transition-colors"
        style={{
          color: palette.text,
          background:
            palette.background,
          borderColor:
            palette.border,
        }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{
            color: palette.text,
            background:
              palette.surface,
            borderColor:
              palette.border,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-lg text-xs font-bold text-white"
              style={{
                background:
                  palette.primary,
              }}
            >
              {initials(brand)}
            </span>
            <span className="text-sm font-bold">
              {brand}
            </span>
          </div>
          <span className="text-lg">
            ☰
          </span>
        </div>

        <div
          className="p-5 text-white"
          style={{
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
          }}
        >
          {mode === "landing" ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
              {valueString(
                draft,
                "landing_eyebrow",
              )}
            </p>
          ) : null}

          <h3 className="mt-3 max-w-[280px] text-3xl font-bold leading-[1.05]">
            {title}
          </h3>

          {mode === "landing" ? (
            <p className="mt-3 max-w-[320px] text-sm leading-6 opacity-85">
              {description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="rounded-lg px-3 py-2 text-xs font-bold"
              style={{
                color:
                  palette.background,
                background:
                  palette.text,
              }}
            >
              {valueString(
                draft,
                "landing_primary_cta_label",
              ) ||
                "Create your account"}
            </span>
            <span className="rounded-lg border border-white/50 px-3 py-2 text-xs font-bold">
              {valueString(
                draft,
                "landing_secondary_cta_label",
              ) || "Sign in"}
            </span>
          </div>
        </div>

        {mode === "landing" ? (
          <div
            className="grid gap-2 p-4 sm:grid-cols-3"
            style={{
              background:
                palette.background,
            }}
          >
            {features.map(
              (
                feature,
                index,
              ) => {
                const Icon = [
                  ShieldCheck,
                  Zap,
                  ArrowRight,
                ][index];

                return (
                  <div
                    key={
                      feature.title
                    }
                    className="rounded-lg border p-3"
                    style={{
                      color:
                        palette.text,
                      background:
                        palette.surface,
                      borderColor:
                        palette.border,
                    }}
                  >
                    <Icon
                      size={17}
                      style={{
                        color:
                          palette.accent,
                      }}
                    />
                    <p className="mt-2 text-xs font-bold">
                      {
                        feature.title
                      }
                    </p>
                    <p
                      className="mt-1 text-[10px] leading-4"
                      style={{
                        color:
                          palette.muted,
                      }}
                    >
                      {
                        feature.description
                      }
                    </p>
                  </div>
                );
              },
            )}
          </div>
        ) : null}
      </div>
    </PreviewFrame>
  );
}

function PreviewFrame({
  title,
  theme,
  onThemeChange,
  children,
}: {
  title: string;
  theme: PreviewTheme;
  onThemeChange: (
    theme: PreviewTheme,
  ) => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      className="rounded-[var(--radius-card)] border p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className="font-semibold"
            style={{
              color: "var(--text)",
            }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-xs"
            style={{
              color: "var(--muted)",
            }}
          >
            Preview unsaved changes in either public-site theme
          </p>
        </div>

        <div
          className="inline-flex rounded-lg border p-1"
          style={{
            borderColor:
              "var(--border)",
            background:
              "var(--surface-alt)",
          }}
        >
          <ThemeButton
            active={
              theme === "light"
            }
            label="Light"
            icon={<Sun size={13} />}
            onClick={() =>
              onThemeChange(
                "light",
              )
            }
          />
          <ThemeButton
            active={
              theme === "dark"
            }
            label="Dark"
            icon={<Moon size={13} />}
            onClick={() =>
              onThemeChange(
                "dark",
              )
            }
          />
        </div>
      </div>

      {children}
    </aside>
  );
}

function ThemeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition"
      style={{
        color: active
          ? "#fff"
          : "var(--muted)",
        background: active
          ? "var(--brand-primary)"
          : "transparent",
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function getPalette(
  draft: Draft,
  theme: PreviewTheme,
) {
  const prefix =
    theme === "dark"
      ? "brand_dark"
      : "brand_light";

  const fallback =
    theme === "dark"
      ? {
          primary: "#2563EB",
          accent: "#60A5FA",
          background: "#08111F",
          surface: "#0F1B2D",
          surfaceAlt: "#142239",
          text: "#F8FAFC",
          muted: "#94A3B8",
          border: "#26364D",
        }
      : {
          primary: "#2563EB",
          accent: "#4F46E5",
          background: "#F8FAFC",
          surface: "#FFFFFF",
          surfaceAlt: "#F1F5F9",
          text: "#0F172A",
          muted: "#64748B",
          border: "#DBE2EA",
        };

  return {
    primary:
      valueString(
        draft,
        `${prefix}_primary_color`,
      ) || fallback.primary,
    accent:
      valueString(
        draft,
        `${prefix}_accent_color`,
      ) || fallback.accent,
    background:
      valueString(
        draft,
        `${prefix}_background_color`,
      ) || fallback.background,
    surface:
      valueString(
        draft,
        `${prefix}_surface_color`,
      ) || fallback.surface,
    surfaceAlt:
      valueString(
        draft,
        `${prefix}_surface_alt_color`,
      ) || fallback.surfaceAlt,
    text:
      valueString(
        draft,
        `${prefix}_text_color`,
      ) || fallback.text,
    muted:
      valueString(
        draft,
        `${prefix}_muted_color`,
      ) || fallback.muted,
    border:
      valueString(
        draft,
        `${prefix}_border_color`,
      ) || fallback.border,
  };
}
