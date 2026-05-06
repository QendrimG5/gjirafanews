import { createApiClient, type ApiClient } from "@gjirafanews/api-client";
import { env } from "./env";

/**
 * Anonymous API client for server components and any caller that doesn't
 * have a Keycloak session. Use this for public reads (articles, categories,
 * sources, notifications list, chat history seed).
 */
export const api: ApiClient = createApiClient({
  baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
});

/**
 * Server-side helper: returns an api client that carries the current user's
 * Keycloak access token. Resolved per-request because the session lives in
 * a request-scoped cookie. Use in admin server actions / RSC that hit
 * authenticated endpoints.
 */
export async function authedApi(): Promise<ApiClient> {
  const { auth } = await import("./auth");
  const session = await auth();
  return createApiClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    getToken: () => (session as { accessToken?: string } | null)?.accessToken ?? null,
  });
}
