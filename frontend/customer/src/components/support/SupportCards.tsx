import type { ComponentType } from "react";
import {
  Mail,
  Phone,
} from "lucide-react";
import {
  FaTelegramPlane,
  FaWhatsapp,
} from "react-icons/fa";

import { useBranding } from "@/context/BrandingContext";

type SupportConfig = {
  support_email?: string | null;
  support_phone?: string | null;
  support_whatsapp_url?: string | null;
  support_telegram_url?: string | null;
};

export function hasConfiguredSupport(
  config: SupportConfig | null | undefined,
) {
  return Boolean(
    config?.support_email ||
      config?.support_phone ||
      config?.support_whatsapp_url ||
      config?.support_telegram_url,
  );
}

type Props = {
  compact?: boolean;
  title?: string;
};

export default function SupportCards({
  compact = false,
  title = "Need help?",
}: Props) {
  const { config } = useBranding();

  const channels = [
    config?.support_email
      ? {
          label: "Email",
          value: config.support_email,
          href: `mailto:${config.support_email}`,
          icon: Mail,
        }
      : null,
    config?.support_phone
      ? {
          label: "Call",
          value: config.support_phone,
          href: `tel:${config.support_phone}`,
          icon: Phone,
        }
      : null,
    config?.support_whatsapp_url
      ? {
          label: "WhatsApp",
          value: "Chat with support",
          href: config.support_whatsapp_url,
          icon: FaWhatsapp,
          external: true,
        }
      : null,
    config?.support_telegram_url
      ? {
          label: "Telegram",
          value: "Open support chat",
          href: config.support_telegram_url,
          icon: FaTelegramPlane,
          external: true,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    href: string;
    icon: ComponentType<{ size?: number | string }>;
    external?: boolean;
  }>;

  if (channels.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3">
        <h2
          className={compact ? "text-sm font-semibold" : "text-lg font-semibold"}
          style={{ color: "var(--text)" }}
        >
          {title}
        </h2>
        {config?.support_hours ? (
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted)" }}
          >
            {config.support_hours}
          </p>
        ) : null}
      </div>

      <div
        className={
          compact
            ? "grid gap-2 sm:grid-cols-2"
            : "grid gap-3 sm:grid-cols-2"
        }
      >
        {channels.map(
          ({ label, value, href, icon: Icon, external }) => (
            <a
              key={label}
              href={href}
              {...(external
                ? {
                    target: "_blank",
                    rel: "noreferrer noopener",
                  }
                : {})}
              className={[
                "flex items-center gap-3 rounded-xl border transition",
                compact ? "p-3" : "p-4 hover:-translate-y-px",
              ].join(" ")}
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg"
                style={{
                  color: "var(--brand-accent)",
                  background: "var(--surface-alt)",
                }}
              >
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span
                  className="block text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {label}
                </span>
                <span
                  className="block truncate text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {value}
                </span>
              </span>
            </a>
          ),
        )}
      </div>
    </section>
  );
}
