export type KeycloakConfig = {
  /** Public-facing Keycloak base URL, e.g. http://localhost:8081 */
  url: string;
  /** Realm name, e.g. "gjirafanews" */
  realm: string;
  /** Client id registered in the realm, e.g. "web" or "admin-web" */
  clientId: string;
};

export const ROLES = ["admin", "user"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Build the OIDC issuer URL from a {@link KeycloakConfig}. */
export function issuerUrl(cfg: KeycloakConfig): string {
  return `${cfg.url.replace(/\/$/, "")}/realms/${cfg.realm}`;
}
