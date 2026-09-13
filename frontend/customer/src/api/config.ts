import { apiClient } from "@/api/client";

export type BrandThemeTokens = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surface_alt: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

export type PublicConfig = {
  brand_name: string;
  brand_short_name: string;
  brand_tagline: string;
  landing_eyebrow: string;
  landing_title: string;
  landing_description: string;
  landing_primary_cta_label: string;
  landing_secondary_cta_label: string;
  landing_feature_1_title: string;
  landing_feature_1_description: string;
  landing_feature_2_title: string;
  landing_feature_2_description: string;
  landing_feature_3_title: string;
  landing_feature_3_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_currency: string;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp_url: string | null;
  support_telegram_url: string | null;
  support_hours: string | null;
  social_facebook_url: string | null;
  social_instagram_url: string | null;
  social_x_url: string | null;
  social_linkedin_url: string | null;
  social_youtube_url: string | null;
  social_tiktok_url: string | null;
  social_discord_url: string | null;
  brand_theme_light: BrandThemeTokens;
  brand_theme_dark: BrandThemeTokens;
};

export async function getPublicConfig(): Promise<PublicConfig> {
  const { data } = await apiClient.get<PublicConfig>("/config/public");
  return data;
}
