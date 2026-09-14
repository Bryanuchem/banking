import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { ThemeMode } from "@/types/theme";

const KEY = "banking_admin_theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(null);

function storedMode(): ThemeMode {
  const value = localStorage.getItem(KEY);
  return value === "light" ||
    value === "dark" ||
    value === "system"
    ? value
    : "system";
}

function resolve(mode: ThemeMode) {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
}: PropsWithChildren) {
  const [mode, setModeState] =
    useState<ThemeMode>(storedMode);
  const [resolvedMode, setResolvedMode] =
    useState<"light" | "dark">(
      () => resolve(mode),
    );

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const apply = () => {
      const next = resolve(mode);
      setResolvedMode(next);
      document.documentElement.classList.toggle(
        "dark",
        next === "dark",
      );
      document.documentElement.dataset.theme = next;
    };

    apply();

    if (mode === "system") {
      media.addEventListener("change", apply);
    }

    return () =>
      media.removeEventListener("change", apply);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      setMode(next: ThemeMode) {
        localStorage.setItem(KEY, next);
        setModeState(next);
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
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error(
      "useTheme must be used inside ThemeProvider",
    );
  }
  return value;
}
