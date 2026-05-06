import { createKeycloak } from "@gjirafanews/auth/spa";

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
};

type TokenParsed = {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
};

const url = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

if (!url || !realm || !clientId) {
  throw new Error(
    "Missing Keycloak env vars: VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID",
  );
}

export const keycloak = createKeycloak({ url, realm, clientId });

let initPromise: Promise<boolean> | null = null;

export function initKeycloak(): Promise<boolean> {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      silentCheckSsoRedirectUri:
        window.location.origin + "/silent-check-sso.html",
      checkLoginIframe: false,
    });
  }
  return initPromise;
}

export function toAuthUser(): AuthUser | null {
  const t = keycloak.tokenParsed as TokenParsed | undefined;
  if (!t) return null;
  return {
    userId: t.sub ?? "",
    email: t.email ?? "",
    name: t.name ?? t.preferred_username ?? "",
    roles: t.realm_access?.roles ?? [],
  };
}

// Refreshes the access token if it expires within 30 seconds.
export async function getAccessToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) return undefined;
  try {
    await keycloak.updateToken(30);
  } catch {
    keycloak.login();
    return undefined;
  }
  return keycloak.token;
}
