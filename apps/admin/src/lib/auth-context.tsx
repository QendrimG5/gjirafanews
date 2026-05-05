import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { keycloak, initKeycloak, toAuthUser, type AuthUser } from "./keycloak";

type AuthContextValue = {
  initialized: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    initKeycloak()
      .then((authed) => {
        if (!mounted) return;
        setAuthenticated(authed);
        setUser(authed ? toAuthUser() : null);
        setInitialized(true);
      })
      .catch(() => {
        if (!mounted) return;
        setInitialized(true);
      });

    keycloak.onAuthSuccess = () => {
      setAuthenticated(true);
      setUser(toAuthUser());
    };
    keycloak.onAuthRefreshSuccess = () => {
      setUser(toAuthUser());
    };
    keycloak.onAuthLogout = () => {
      setAuthenticated(false);
      setUser(null);
    };
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => keycloak.login());
    };

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    initialized,
    authenticated,
    user,
    login: () => keycloak.login(),
    logout: () =>
      keycloak.logout({ redirectUri: window.location.origin + "/login" }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
