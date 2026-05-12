// SPA entry point — wraps keycloak-js for single-page apps (admin).
// Loaded lazily by consumers that opt in via `import("@gjirafanews/auth/spa")`.

import Keycloak from "keycloak-js";
import type { KeycloakConfig } from "./config";

/**
 * Creates a configured `Keycloak` instance. Caller controls init timing.
 *
 * Example:
 *   const kc = createKeycloak({ url, realm, clientId });
 *   await kc.init({ onLoad: "check-sso", pkceMethod: "S256" });
 */
export function createKeycloak(cfg: KeycloakConfig): Keycloak {
  return new Keycloak({
    url: cfg.url,
    realm: cfg.realm,
    clientId: cfg.clientId,
  });
}

export type { Keycloak };
