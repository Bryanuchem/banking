import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { ThemeMode } from "@/types/theme";

const THEME_KEY = "banking_theme_mode";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredMode(): ThemeMode {
  const value = localStorage.getItem(THEME_KEY);

  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyMode(mode: "light" | "dark") {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() =>
    resolveMode(mode),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => {
      const resolved = resolveMode(mode);
      setResolvedMode(resolved);
      applyMode(resolved);
    };

    update();

    if (mode === "system") {
      media.addEventListener("change", update);
    }

    return () => media.removeEventListener("change", update);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode(nextMode) {
        localStorage.setItem(THEME_KEY, nextMode);
        setModeState(nextMode);
      },
    }),
    [mode, resolvedMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
