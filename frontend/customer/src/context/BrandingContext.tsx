import {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getPublicConfig,
  type PublicConfig,
} from "@/api/config";
import { useTheme } from "@/context/ThemeContext";
import { applyBranding } from "@/styles/applyBranding";

type BrandingContextValue = {
  config: PublicConfig | null;
  isLoading: boolean;
  isError: boolean;
};

const BrandingContext =
  createContext<BrandingContextValue | null>(null);

export function BrandingProvider({
  children,
}: PropsWithChildren) {
  const { resolvedMode } = useTheme();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-config"],
    queryFn: getPublicConfig,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    applyBranding(data, resolvedMode);
  }, [data, resolvedMode]);

  return (
    <BrandingContext.Provider
      value={{
        config: data ?? null,
        isLoading,
        isError,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);

  if (!context) {
    throw new Error(
      "useBranding must be used inside BrandingProvider",
    );
  }

  return context;
}
