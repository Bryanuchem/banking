import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  getCurrentUser,
  logout as logoutRequest,
} from "@/api/auth";
import type { AdminUser } from "@/types/auth";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/utils/storage";

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  establishSession: (
    token: string,
    remember: boolean,
  ) => Promise<AdminUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<AdminUser | null>;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [user, setUser] =
    useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const current = await getCurrentUser();
      setUser(current);
      return current;
    } catch {
      clearAccessToken();
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    void loadUser().finally(() =>
      setLoading(false),
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.is_admin),

      async establishSession(
        token: string,
        remember: boolean,
      ) {
        setAccessToken(token, remember);

        try {
          const current = await getCurrentUser();

          if (!current.is_admin) {
            try {
              await logoutRequest();
            } finally {
              clearAccessToken();
            }

            setUser(null);

            throw new Error(
              "ADMIN_ACCESS_REQUIRED",
            );
          }

          setUser(current);
          return current;
        } catch (error) {
          clearAccessToken();
          setUser(null);
          throw error;
        }
      },

      async signOut() {
        if (getAccessToken()) {
          try {
            await logoutRequest();
          } catch {
            // Local sign-out must still succeed if the
            // API is temporarily unavailable.
          }
        }

        clearAccessToken();
        setUser(null);
      },

      refreshUser: loadUser,
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error(
      "useAdminAuth must be used inside AuthProvider",
    );
  }

  return value;
}
