# Authentication

Keycloak is the identity provider for both frontends. The .NET API validates
JWTs against the `gjirafanews` realm and uses the `admin` realm role for
authorization.

## Realm + clients

The realm is provisioned via `infra/keycloak/realm-export.json`. Two clients
ship out of the box:

| Client       | Type          | Used by                      | Redirect URIs                                        |
| ------------ | ------------- | ---------------------------- | ---------------------------------------------------- |
| `admin-web`  | public + PKCE | `apps/admin` (Vite SPA)      | `http://localhost:3002/*`                            |
| `web`        | confidential  | `apps/web` (Next.js)         | `http://localhost:3000/api/auth/callback/keycloak`, `http://localhost:3000/` |

Both clients map a custom audience claim `gjirafanews-api` so the .NET API
accepts their tokens (the API's `Keycloak:Audience` defaults to that value).

## Roles

Two realm roles, defined in the export:

- `admin` — full admin access (`/users`, write endpoints on `/api/articles`,
  `/api/categories`, `/api/sources`, `/api/notifications/broadcast`).
- `user` — regular user role.

The seeded user `admin@gjirafanews.com` (password `admin123`, dev-only) has
both roles.

## Frontend integration

### `apps/admin` — Vite SPA via `keycloak-js`

Uses the shared SPA helper at `@gjirafanews/auth/spa`:

```ts
import { createKeycloak } from "@gjirafanews/auth/spa";
export const keycloak = createKeycloak({ url, realm, clientId });
```

The existing `auth-context.tsx` initializes Keycloak with `check-sso` + PKCE.
`getAccessToken()` refreshes the token with a 30-second skew before every API
call. The api-client at `src/lib/api.ts` wires this in via:

```ts
createApiClient({ baseUrl: VITE_API_URL, getToken: () => getAccessToken() });
```

### `apps/web` — Next.js via Auth.js v5

Auth.js v5 (`next-auth@beta`) handles the OAuth/OIDC dance. Configuration
lives in `apps/web/lib/auth.ts` and consumes `@gjirafanews/auth/nextauth`:

```ts
import NextAuth from "next-auth";
import { keycloakProvider, authJsCallbacks } from "@gjirafanews/auth/nextauth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [keycloakProvider({ url, realm, clientId, clientSecret })],
  callbacks: authJsCallbacks,
});
```

The handler is wired at `app/api/auth/[...nextauth]/route.ts`. The session
exposes `accessToken` and `roles`, which `apps/web/lib/api.ts#authedApi()`
forwards to the api-client as `Bearer ${accessToken}`.

## Local dev setup

1. Boot the infra profile:

   ```pwsh
   docker compose -f infra/compose.yml --profile infra up -d
   ```

2. Confirm the realm imported correctly:

   ```pwsh
   curl http://localhost:8081/realms/gjirafanews/.well-known/openid-configuration
   ```

3. The `web` client is confidential. The shared dev secret is committed in
   `realm-export.json` (`web-dev-secret-change-me`); rotate it for any
   non-dev environment and pass via `KEYCLOAK_CLIENT_SECRET` in
   `infra/.env`.

4. Sign in:
   - Web: visit `http://localhost:3000`, click "Kyqu" → redirected to
     Keycloak (`8081`) → back with an Auth.js session.
   - Admin: visit `http://localhost:3002` → automatically redirected to
     Keycloak by `keycloak-js`.

## Resetting the realm

The Keycloak realm is imported on first boot of the `keycloak-db` volume. If
you change `realm-export.json` and want the changes to take effect:

```pwsh
docker compose -f infra/compose.yml down keycloak keycloak-db
docker volume rm gjirafanews_keycloak_db_data
docker compose -f infra/compose.yml --profile infra up -d keycloak
```

> The seeded admin user is recreated by the import; any users you created in
> the admin console are wiped. Dev-only.

## API audience + role flattening

The .NET API validates JWTs in `Program.cs#ConfigureKeycloakAuth`:

- `Authority`: `http://keycloak:8080/realms/gjirafanews` (in compose) or
  `http://localhost:8081/realms/gjirafanews` (host-side).
- `Audience`: `gjirafanews-api`.
- `OnTokenValidated` flattens Keycloak's nested `realm_access.roles` into
  individual `ClaimTypes.Role` claims so `[Authorize(Policy = "AdminOnly")]`
  works against `RequireRole("admin")`.

SignalR negotiates over WebSocket where `Authorization` headers can't be set,
so `OnMessageReceived` also accepts the access token in the
`?access_token=...` query string for hub paths only.
