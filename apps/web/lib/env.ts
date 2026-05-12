import { z } from "zod";

const browserSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_KEYCLOAK_URL: z.string().url(),
  NEXT_PUBLIC_KEYCLOAK_REALM: z.string().min(1),
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_ADMIN_URL: z.string().url(),
});

export type WebEnv = z.infer<typeof browserSchema> & {
  AUTH_SECRET?: string;
  KEYCLOAK_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  RESEND_NOTIFY_TO?: string;
};

const parsed = browserSchema.parse({
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5283",
  NEXT_PUBLIC_KEYCLOAK_URL:
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8081",
  NEXT_PUBLIC_KEYCLOAK_REALM:
    process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "gjirafanews",
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID:
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "web",
  NEXT_PUBLIC_ADMIN_URL:
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002",
});

export const env: WebEnv = {
  ...parsed,
  AUTH_SECRET: process.env.AUTH_SECRET,
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  RESEND_NOTIFY_TO: process.env.RESEND_NOTIFY_TO,
};
