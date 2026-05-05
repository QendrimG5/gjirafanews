# admin

Vite + React admin panel for GjirafaNews. Authenticates via **Keycloak** (OIDC Authorization Code + PKCE) and talks to the **.NET API**. (Until phase 8 of the architecture plan, content endpoints temporarily go through the Next.js `web` app — see `VITE_CONTENT_API_URL` below.)

## Running locally

Three processes must be up. Easiest path: bring up infra + api in Docker, run `admin` on the host.

### 1. Backing services (Keycloak, Postgres, Redis, etc.)

From the repo root:

```bash
cp infra/.env.example infra/.env       # first time only
docker compose -f infra/compose.yml --profile infra up -d
```

On first boot Keycloak imports `infra/keycloak/realm-export.json`, which creates:

- Realm: `gjirafanews`
- Client: `admin-web` (public, PKCE, redirects to `http://localhost:3002`)
- User: `admin@gjirafanews.com` / `admin123` (realm role `admin`)

Admin console: <http://localhost:8081> (login `admin` / `admin`).

### 2. .NET API (port 5283)

```bash
docker compose -f infra/compose.yml --profile api up -d --build
# or run on the host:
dotnet run --project apps/api/GjirafaNewsAPI.csproj
```

The API validates bearer tokens issued by Keycloak. Admin endpoints use `[Authorize(Policy = "AdminOnly")]`; `GET /users/me` only requires authentication and returns the current user's claims.

### 3. Next.js content API (port 3000) — temporary

Admin still calls `web` for articles, categories, and sources until phase 8 of the architecture plan moves those to the .NET API.

```bash
pnpm --filter @gjirafanews/web dev
```

`web`'s middleware accepts both the original session cookie and Keycloak bearer tokens, and emits CORS headers for `http://localhost:3002`.

### 4. admin (port 3002)

```bash
cp apps/admin/.env.example apps/admin/.env.local    # first time only
pnpm --filter @gjirafanews/admin dev
```

Open <http://localhost:3002>. You'll be redirected to Keycloak, sign in with the seeded admin, and land back on the dashboard.

## Environment variables

| Variable | Example | Used by |
|---|---|---|
| `VITE_KEYCLOAK_URL` | `http://localhost:8081` | `src/lib/keycloak.ts` |
| `VITE_KEYCLOAK_REALM` | `gjirafanews` | `src/lib/keycloak.ts` |
| `VITE_KEYCLOAK_CLIENT_ID` | `admin-web` | `src/lib/keycloak.ts` |
| `VITE_API_URL` | `http://localhost:5283` | `src/lib/api.ts` (auth endpoints) |
| `VITE_CONTENT_API_URL` | `http://localhost:3000/api` | `src/lib/api.ts` (articles/categories/sources, until phase 8) |

> The Keycloak client ID is still `admin-web` — that's the literal name of the
> client object inside Keycloak. The folder rename to `apps/admin/` doesn't
> affect it.

## Token flow

1. `AuthProvider` (`src/lib/auth-context.tsx`) calls `keycloak.init({ onLoad: 'check-sso', pkceMethod: 'S256' })` on mount. A hidden iframe at `/silent-check-sso.html` probes for an existing Keycloak session.
2. `ProtectedRoute` redirects unauthenticated visits to `/login`, which triggers `keycloak.login()` (full redirect to Keycloak).
3. After login, Keycloak redirects back with an authorization code; keycloak-js exchanges it for an access token and refresh token in memory.
4. Every API request runs through `authorizedFetch()` in `src/lib/api.ts`, which calls `keycloak.updateToken(30)` (refreshing if the access token expires within 30 s) and attaches `Authorization: Bearer <token>`.
5. Logout calls `keycloak.logout({ redirectUri: "/login" })`, which clears the Keycloak SSO session as well.

## Default admin credentials

```
email:    admin@gjirafanews.com
password: admin123
```

Both live in `infra/keycloak/realm-export.json`. Change them there (or in the Keycloak admin console) for anything beyond local dev.
