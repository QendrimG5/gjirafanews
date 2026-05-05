import "server-only";
import { headers } from "next/headers";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getSession } from "@/lib/session";

type AdminSession = {
  userId: string;
  role: string;
  name: string;
  email: string;
};

type AuthorizedResult = { authorized: true; session: AdminSession };
type UnauthorizedResult = { authorized: false; response: Response };

// Keycloak bearer-token acceptance. Lazily initialized so routes that don't
// need it (e.g. unit tests without KEYCLOAK_ISSUER set) still work.
const keycloakIssuer = process.env.KEYCLOAK_ISSUER;
const keycloakJwks = keycloakIssuer
  ? createRemoteJWKSet(
      new URL(`${keycloakIssuer}/protocol/openid-connect/certs`),
    )
  : null;

type KeycloakPayload = JWTPayload & {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
};

async function verifyKeycloakBearer(
  token: string,
): Promise<AdminSession | null> {
  if (!keycloakJwks || !keycloakIssuer) return null;

  try {
    const { payload } = await jwtVerify<KeycloakPayload>(token, keycloakJwks, {
      issuer: keycloakIssuer,
    });

    const roles = payload.realm_access?.roles ?? [];
    if (!roles.includes("admin")) return null;

    return {
      userId: payload.sub ?? "",
      role: "admin",
      name: payload.name ?? payload.preferred_username ?? "",
      email: payload.email ?? "",
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<
  AuthorizedResult | UnauthorizedResult
> {
  const headerList = await headers();
  const authHeader = headerList.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    const kcSession = await verifyKeycloakBearer(token);
    if (kcSession) {
      return { authorized: true, session: kcSession };
    }
    return {
      authorized: false,
      response: Response.json(
        { error: "Invalid or unauthorized bearer token" },
        { status: 401 },
      ),
    };
  }

  const session = await getSession();
  if (!session) {
    return {
      authorized: false,
      response: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }
  if (session.role !== "admin") {
    return {
      authorized: false,
      response: Response.json(
        { error: "Admin access required" },
        { status: 403 },
      ),
    };
  }
  return { authorized: true, session };
}
