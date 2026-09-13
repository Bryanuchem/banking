import {
  FaDiscord,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import type { IconType } from "react-icons";

import { useBranding } from "@/context/BrandingContext";

export default function PublicFooter() {
  const { config } = useBranding();

  const links = [
    config?.social_facebook_url
      ? {
          label: "Facebook",
          href: config.social_facebook_url,
          icon: FaFacebookF,
        }
      : null,
    config?.social_instagram_url
      ? {
          label: "Instagram",
          href: config.social_instagram_url,
          icon: FaInstagram,
        }
      : null,
    config?.social_x_url
      ? {
          label: "X",
          href: config.social_x_url,
          icon: FaXTwitter,
        }
      : null,
    config?.social_linkedin_url
      ? {
          label: "LinkedIn",
          href: config.social_linkedin_url,
          icon: FaLinkedinIn,
        }
      : null,
    config?.social_youtube_url
      ? {
          label: "YouTube",
          href: config.social_youtube_url,
          icon: FaYoutube,
        }
      : null,
    config?.social_tiktok_url
      ? {
          label: "TikTok",
          href: config.social_tiktok_url,
          icon: FaTiktok,
        }
      : null,
    config?.social_discord_url
      ? {
          label: "Discord",
          href: config.social_discord_url,
          icon: FaDiscord,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    icon: IconType;
  }>;

  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            © {new Date().getFullYear()}{" "}
            {config?.brand_name ?? "Banking"}
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted)" }}
          >
            {config?.brand_tagline ??
              "Private banking, clearly managed."}
          </p>
        </div>

        {links.length > 0 ? (
          <div
            className="flex items-center gap-2"
            aria-label="Social links"
          >
            {links.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                title={label}
                className="grid size-9 place-items-center rounded-full border"
                style={{
                  color: "var(--muted)",
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                }}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
