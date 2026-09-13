import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";
import type { ThemeMode } from "@/types/theme";

const options: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      className="inline-flex rounded-xl border p-1"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-alt)",
      }}
      aria-label="Theme"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = mode === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={active}
            title={label}
            className="grid size-9 place-items-center rounded-lg transition"
            style={{
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--text)" : "var(--muted)",
              boxShadow: active ? "var(--shadow-card)" : "none",
            }}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
