import type {
  BrandThemeTokens,
  PublicConfig,
} from "@/types/config";

const MAP: Record<keyof BrandThemeTokens, string> = {
  primary: "--brand-primary",
  secondary: "--brand-secondary",
  accent: "--brand-accent",
  background: "--bg",
  surface: "--surface",
  surface_alt: "--surface-alt",
  text: "--text",
  muted: "--muted",
  border: "--border",
  success: "--success",
  warning: "--warning",
  danger: "--danger",
};

export function applyBranding(
  config: PublicConfig,
  mode: "light" | "dark",
) {
  const theme =
    mode === "dark"
      ? config.brand_theme_dark
      : config.brand_theme_light;

  for (const [key, variable] of Object.entries(MAP)) {
    document.documentElement.style.setProperty(
      variable,
      theme[key as keyof BrandThemeTokens],
    );
  }

  document.title = `${config.brand_name} Admin`;

  if (config.favicon_url) {
    let favicon =
      document.querySelector<HTMLLinkElement>(
        'link[rel="icon"]',
      );

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = config.favicon_url;
  }
}
