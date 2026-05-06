import { isRole, type Role } from "./config";

type KeycloakTokenPayload = {
  exp?: number;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

/**
 * Decodes the payload of a JWT without verifying its signature.
 * Safe for client-side reads of trusted tokens (Auth.js / keycloak-js have
 * already verified them); never use the result for authorization decisions
 * server-side without separate verification.
 */
export function decodeJwt<T = KeycloakTokenPayload>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Extracts realm-level roles ("admin", "user") from a Keycloak access token. */
export function rolesFromToken(token: string): Role[] {
  const payload = decodeJwt(token);
  const raw = payload?.realm_access?.roles ?? [];
  return raw.filter(isRole);
}

/** Returns true if the token's `exp` claim is in the past (with optional skew). */
export function isExpired(token: string, skewSeconds = 0): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
