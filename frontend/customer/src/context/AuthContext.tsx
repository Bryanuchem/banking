import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/utils/storage";

const CHALLENGE_KEY = "banking_2fa_challenge";

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  challengeToken: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
  beginTwoFactor: (challengeToken: string) => void;
  clearTwoFactor: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getChallengeToken() {
  return sessionStorage.getItem(CHALLENGE_KEY);
}

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [accessToken, setToken] = useState<string | null>(
    () => getAccessToken(),
  );
  const [challengeToken, setChallengeToken] =
    useState<string | null>(() => getChallengeToken());

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      challengeToken,
      signIn(token) {
        setAccessToken(token);
        setToken(token);
        sessionStorage.removeItem(CHALLENGE_KEY);
        setChallengeToken(null);
      },
      signOut() {
        clearAccessToken();
        setToken(null);
        sessionStorage.removeItem(CHALLENGE_KEY);
        setChallengeToken(null);
      },
      beginTwoFactor(token) {
        sessionStorage.setItem(CHALLENGE_KEY, token);
        setChallengeToken(token);
      },
      clearTwoFactor() {
        sessionStorage.removeItem(CHALLENGE_KEY);
        setChallengeToken(null);
      },
    }),
    [accessToken, challengeToken],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider",
    );
  }

  return context;
}
