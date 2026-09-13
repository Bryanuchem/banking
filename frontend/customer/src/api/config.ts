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
  logo_url: string | null;
  favicon_url: string | null;
  primary_currency: string;
  support_email: string | null;
  support_phone: string | null;
  brand_theme_light: BrandThemeTokens;
  brand_theme_dark: BrandThemeTokens;
};

export async function getPublicConfig(): Promise<PublicConfig> {
  const { data } = await apiClient.get<PublicConfig>("/config/public");
  return data;
}
