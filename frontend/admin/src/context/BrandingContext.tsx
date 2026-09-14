import {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { getPublicConfig } from "@/api/config";
import { useTheme } from "@/context/ThemeContext";
import { applyBranding } from "@/styles/applyBranding";
import type { PublicConfig } from "@/types/config";

type Value = {
  config: PublicConfig | null;
  isLoading: boolean;
  isError: boolean;
};

const BrandingContext = createContext<Value | null>(null);

export function BrandingProvider({
  children,
}: PropsWithChildren) {
  const { resolvedMode } = useTheme();

  const query = useQuery({
    queryKey: ["admin", "public-config"],
    queryFn: getPublicConfig,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      applyBranding(query.data, resolvedMode);
    }
  }, [query.data, resolvedMode]);

  return (
    <BrandingContext.Provider
      value={{
        config: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const value = useContext(BrandingContext);
  if (!value) {
    throw new Error(
      "useBranding must be used inside BrandingProvider",
    );
  }
  return value;
}
