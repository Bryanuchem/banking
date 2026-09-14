import {
  Brush,
  CreditCard,
  Headphones,
  Mail,
  PanelTop,
  SlidersHorizontal,
} from "lucide-react";

import { tabs } from "@/pages/Settings/settings";

const icons = {
  branding: Brush,
  landing: PanelTop,
  support: Headphones,
  payments: CreditCard,
  smtp: Mail,
  rules: SlidersHorizontal,
};

export default function SettingsTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto rounded-xl border p-2"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {tabs.map(([value, label]) => {
        const Icon = icons[value];
        return (
          <button
            key={value}
            type="button"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
            style={{
              color:
                active === value
                  ? "#fff"
                  : "var(--muted)",
              background:
                active === value
                  ? "var(--brand-primary)"
                  : "transparent",
            }}
            onClick={() => onChange(value)}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
