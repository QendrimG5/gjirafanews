import NextAuth from "next-auth";
import {
  keycloakProvider,
  authJsCallbacks,
} from "@gjirafanews/auth/nextauth";
import { env } from "./env";

if (!env.AUTH_SECRET) {
  // Development fallback — Auth.js requires *some* secret. Production fails
  // fast via env.ts since AUTH_SECRET is required there.
  process.env.AUTH_SECRET ??= "dev-only-change-me-min-32-characters";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    keycloakProvider({
      url: env.NEXT_PUBLIC_KEYCLOAK_URL,
      realm: env.NEXT_PUBLIC_KEYCLOAK_REALM,
      clientId: env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET ?? "web-dev-secret-change-me",
    }),
  ],
  callbacks: authJsCallbacks,
  trustHost: true,
});
