import type {
  BrandThemeTokens,
  PublicConfig,
} from "@/api/config";

const VARIABLE_MAP: Record<keyof BrandThemeTokens, string> = {
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

function applyTheme(theme: BrandThemeTokens) {
  const root = document.documentElement;

  for (const [key, variable] of Object.entries(VARIABLE_MAP)) {
    root.style.setProperty(
      variable,
      theme[key as keyof BrandThemeTokens],
    );
  }
}

function applyFavicon(url: string | null) {
  if (!url) {
    return;
  }

  let element = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"]',
  );

  if (!element) {
    element = document.createElement("link");
    element.rel = "icon";
    document.head.appendChild(element);
  }

  element.href = url;
}

export function applyBranding(
  config: PublicConfig,
  resolvedMode: "light" | "dark",
) {
  applyTheme(
    resolvedMode === "dark"
      ? config.brand_theme_dark
      : config.brand_theme_light,
  );

  document.title = config.brand_name;
  applyFavicon(config.favicon_url);
}
