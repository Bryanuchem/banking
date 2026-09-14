import {
  Laptop,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/context/ThemeContext";
import type { ThemeMode } from "@/types/theme";

export default function ThemeToggle() {
  const {
    mode,
    resolvedMode,
    setMode,
  } = useTheme();
  const [open, setOpen] = useState(false);

  const Icon =
    resolvedMode === "dark" ? Moon : Sun;

  const options: Array<{
    mode: ThemeMode;
    label: string;
    icon: typeof Sun;
  }> = [
    {
      mode: "system",
      label: "System",
      icon: Laptop,
    },
    {
      mode: "light",
      label: "Light",
      icon: Sun,
    },
    {
      mode: "dark",
      label: "Dark",
      icon: Moon,
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        className="grid size-10 place-items-center rounded-xl border"
        style={{
          color: "var(--muted)",
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
        aria-label="Change appearance"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon size={17} />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-12 z-50 w-40 rounded-xl border p-1.5 shadow-xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {options.map((item) => {
            const OptionIcon = item.icon;
            return (
              <button
                key={item.mode}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                style={{
                  color: "var(--text)",
                  background:
                    mode === item.mode
                      ? "var(--surface-alt)"
                      : "transparent",
                }}
                onClick={() => {
                  setMode(item.mode);
                  setOpen(false);
                }}
              >
                <OptionIcon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
