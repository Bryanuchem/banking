import {
  Check,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useTheme } from "@/context/ThemeContext";
import type { ThemeMode } from "@/types/theme";

const options: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current =
    options.find((option) => option.value === mode) ??
    options[0];

  const CurrentIcon = current.icon;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  function selectMode(value: ThemeMode) {
    setMode(value);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className="relative z-50 inline-flex"
    >
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-label={`Appearance: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Appearance: ${current.label}`}
        className="
          grid size-10 place-items-center rounded-xl border
          transition
          hover:-translate-y-px
          focus-visible:outline-none focus-visible:ring-2
        "
        style={{
          color: "var(--muted)",
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <CurrentIcon size={18} strokeWidth={1.8} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Appearance"
          className="
            absolute right-0 top-full mt-2
            w-44 max-w-[calc(100vw-2rem)]
            rounded-2xl border p-2
          "
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow:
              "0 18px 45px color-mix(in srgb, var(--text) 14%, transparent)",
          }}
        >
          <div
            className="
              px-2.5 pb-2 pt-1 text-[11px] font-semibold
              uppercase tracking-[0.14em]
            "
            style={{ color: "var(--muted)" }}
          >
            Appearance
          </div>

          <div className="space-y-1">
            {options.map(
              ({ value, label, icon: Icon }) => {
                const active = mode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => selectMode(value)}
                    className="
                      flex w-full items-center gap-3
                      rounded-xl px-2.5 py-2 text-left text-sm
                      transition
                    "
                    style={{
                      color: active
                        ? "var(--text)"
                        : "var(--muted)",
                      background: active
                        ? "color-mix(in srgb, var(--brand-accent) 10%, var(--surface))"
                        : "transparent",
                    }}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                      className="shrink-0"
                    />

                    <span className="flex-1">
                      {label}
                    </span>

                    {active ? (
                      <Check
                        size={16}
                        strokeWidth={2}
                        style={{
                          color: "var(--brand-accent)",
                        }}
                      />
                    ) : null}
                  </button>
                );
              },
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
