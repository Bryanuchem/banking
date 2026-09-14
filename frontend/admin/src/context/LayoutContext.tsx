import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type Value = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (
    value: boolean,
  ) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
};

const LayoutContext =
  createContext<Value | null>(null);

export function LayoutProvider({
  children,
}: PropsWithChildren) {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileOpen,
      setMobileOpen,
    }),
    [sidebarCollapsed, mobileOpen],
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const value = useContext(LayoutContext);
  if (!value) {
    throw new Error(
      "useAdminLayout must be used inside LayoutProvider",
    );
  }
  return value;
}
