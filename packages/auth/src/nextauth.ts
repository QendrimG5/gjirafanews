// Next.js entry point — Auth.js v5 Keycloak provider + callbacks.
// Loaded by consumers that opt in via `import("@gjirafanews/auth/nextauth")`.

import Keycloak from "next-auth/providers/keycloak";
import type { Provider } from "next-auth/providers";
import type { KeycloakConfig } from "./config";
import { issuerUrl } from "./config";
import { rolesFromToken } from "./tokens";

export type KeycloakProviderEnv = KeycloakConfig & {
  /** Confidential client secret. Required by Auth.js even with PKCE. */
  clientSecret: string;
};

/** Builds an Auth.js Keycloak provider from explicit config. */
export function keycloakProvider(env: KeycloakProviderEnv): Provider {
  return Keycloak({
    issuer: issuerUrl(env),
    clientId: env.clientId,
    clientSecret: env.clientSecret,
  });
}

/** Reads `KEYCLOAK_*` env vars and builds the provider. */
export function keycloakProviderFromEnv(): Provider {
  const url = required("NEXT_PUBLIC_KEYCLOAK_URL");
  const realm = required("NEXT_PUBLIC_KEYCLOAK_REALM");
  const clientId = required("NEXT_PUBLIC_KEYCLOAK_CLIENT_ID");
  const clientSecret = required("KEYCLOAK_CLIENT_SECRET");
  return keycloakProvider({ url, realm, clientId, clientSecret });
}

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

/**
 * Auth.js v5 callbacks that persist the Keycloak access token + roles into
 * the JWT cookie and surface them on the typed Session.
 *
 * Typed loosely so consumers can spread it into NextAuth's strict
 * `callbacks` shape without TS narrowing issues.
 *
 * Wire as:
 *   NextAuth({
 *     providers: [keycloakProviderFromEnv()],
 *     callbacks: authJsCallbacks,
 *   });
 */
export const authJsCallbacks: Record<string, (...args: any[]) => any> = {
  async jwt({ token, account }: any) {
    if (account?.access_token) {
      token.accessToken = account.access_token;
      token.refreshToken = account.refresh_token;
      token.expiresAt = account.expires_at;
      token.roles = rolesFromToken(account.access_token);
    }
    return token;
  },
  async session({ session, token }: any) {
    session.accessToken = token.accessToken;
    session.roles = token.roles ?? [];
    if (session.user) session.user.roles = token.roles ?? [];
    return session;
  },
};
