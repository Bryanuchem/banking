import type { AdminSettingItem } from "@/types/admin";

export type Draft = Record<string, unknown>;

export const tabs = [
  ["branding", "Branding"],
  ["landing", "Landing"],
  ["support", "Support & Social"],
  ["payments", "Payments"],
  ["smtp", "Email / SMTP"],
  ["rules", "Platform Rules"],
] as const;

export const sectionKeys: Record<string, string[]> = {
  branding: [
    "brand_name",
    "brand_short_name",
    "brand_tagline",
    "logo_url",
    "favicon_url",
    "primary_currency",
    "brand_light_primary_color",
    "brand_light_secondary_color",
    "brand_light_accent_color",
  ],
  landing: [
    "landing_eyebrow",
    "landing_title",
    "landing_description",
    "landing_primary_cta_label",
    "landing_secondary_cta_label",
    "landing_feature_1_title",
    "landing_feature_1_description",
    "landing_feature_2_title",
    "landing_feature_2_description",
    "landing_feature_3_title",
    "landing_feature_3_description",
  ],
  support: [
    "support_email",
    "support_phone",
    "support_whatsapp_url",
    "support_telegram_url",
    "support_hours",
    "social_facebook_url",
    "social_instagram_url",
    "social_x_url",
    "social_linkedin_url",
    "social_youtube_url",
    "social_tiktok_url",
    "social_discord_url",
  ],
  smtp: [
    "smtp_enabled",
    "smtp_host",
    "smtp_port",
    "smtp_username",
    "smtp_password",
    "smtp_from_email",
    "smtp_from_name",
    "smtp_use_tls",
    "smtp_use_ssl",
  ],
  rules: [
    "withdrawal_fee_percent",
    "registration_enabled",
    "email_verification_required",
    "cors_allowed_origins",
  ],
};

export function settingsDraft(
  settings: AdminSettingItem[],
): Draft {
  const result: Draft = {};
  for (const item of settings) {
    result[item.key] = item.is_secret
      ? ""
      : item.value;
  }
  return result;
}

export function settingMap(
  settings: AdminSettingItem[],
) {
  return new Map(
    settings.map((item) => [item.key, item]),
  );
}

export function valueString(
  draft: Draft,
  key: string,
) {
  const value = draft[key];
  return value == null ? "" : String(value);
}

export function valueBoolean(
  draft: Draft,
  key: string,
) {
  return Boolean(draft[key]);
}
