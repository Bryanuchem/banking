import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

export type SnackbarTone =
  | "success"
  | "error"
  | "warning"
  | "info";

export type SnackbarItem = {
  id: number;
  message: string;
  tone: SnackbarTone;
};

type SnackbarContextValue = {
  items: SnackbarItem[];
  showSnackbar: (
    message: string,
    tone?: SnackbarTone,
  ) => void;
  dismissSnackbar: (id: number) => void;
};

const SnackbarContext =
  createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({
  children,
}: PropsWithChildren) {
  const [items, setItems] = useState<SnackbarItem[]>([]);
  const idRef = useRef(1);

  const dismissSnackbar = useCallback((id: number) => {
    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  }, []);

  const showSnackbar = useCallback(
    (
      message: string,
      tone: SnackbarTone = "info",
    ) => {
      const id = idRef.current++;
      setItems((current) => [
        ...current,
        { id, message, tone },
      ]);

      window.setTimeout(() => {
        dismissSnackbar(id);
      }, 3600);
    },
    [dismissSnackbar],
  );

  const value = useMemo(
    () => ({
      items,
      showSnackbar,
      dismissSnackbar,
    }),
    [items, showSnackbar, dismissSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const value = useContext(SnackbarContext);

  if (!value) {
    throw new Error(
      "useSnackbar must be used inside SnackbarProvider",
    );
  }

  return value;
}
