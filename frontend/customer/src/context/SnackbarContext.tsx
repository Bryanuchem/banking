import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Snackbar from "@/components/common/Snackbar";

export type SnackbarSeverity =
  | "success"
  | "error"
  | "warning"
  | "info";

type SnackbarItem = {
  id: number;
  message: string;
  severity: SnackbarSeverity;
};

type SnackbarContextValue = {
  showSnackbar: (
    message: string,
    severity?: SnackbarSeverity,
  ) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const SnackbarContext =
  createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({
  children,
}: {
  children: ReactNode;
}) {
  const nextId = useRef(1);
  const [queue, setQueue] = useState<SnackbarItem[]>([]);

  const showSnackbar = useCallback(
    (
      message: string,
      severity: SnackbarSeverity = "info",
    ) => {
      const normalized = message.trim();

      if (!normalized) return;

      setQueue((current) => [
        ...current,
        {
          id: nextId.current++,
          message: normalized,
          severity,
        },
      ]);
    },
    [],
  );

  const closeCurrent = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSnackbar,
      success: (message) =>
        showSnackbar(message, "success"),
      error: (message) =>
        showSnackbar(message, "error"),
      warning: (message) =>
        showSnackbar(message, "warning"),
      info: (message) =>
        showSnackbar(message, "info"),
    }),
    [showSnackbar],
  );

  const current = queue[0];

  return (
    <SnackbarContext.Provider value={value}>
      {children}

      {current ? (
        <Snackbar
          key={current.id}
          message={current.message}
          severity={current.severity}
          onClose={closeCurrent}
        />
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error(
      "useSnackbar must be used within a SnackbarProvider.",
    );
  }

  return context;
}
