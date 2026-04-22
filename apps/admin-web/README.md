# admin-web

Vite + React admin panel for GjirafaNews. Authenticates via **Keycloak** (OIDC Authorization Code + PKCE) and talks to the **.NET API** for user/auth endpoints and the **Next.js API** (`gjirafa-news`) for content endpoints.

## Running locally

Three processes must be up:

### 1. Keycloak (port 8080)

From the repo root:

```bash
cp .env.example .env         # first time only
docker compose -f docker-compose.keycloak.yml up -d
```

On first boot Keycloak imports `infra/keycloak/realm-export.json`, which creates:

- Realm: `gjirafanews`
- Client: `admin-web` (public, PKCE, redirects to `http://localhost:3002`)
- User: `admin@gjirafanews.com` / `admin123` (realm role `admin`)

Admin console: <http://localhost:8080> (login `admin` / `admin`).

### 2. .NET API (port 5283)

```bash
cd apps/GjirafaNews/GjirafaNewsAPI
dotnet run
```

The API validates bearer tokens issued by Keycloak. `GET /users` and the other admin endpoints are `[Authorize(Policy = "AdminOnly")]`; `GET /users/me` only requires authentication and returns the current user's claims.

### 3. Next.js content API (port 3000)

Admin-web still calls `gjirafa-news` for articles, categories, and sources.

```bash
pnpm --filter @gjirafanews/gjirafa-news dev
```

The Next.js `requireAdmin()` guard accepts both the original session cookie and Keycloak bearer tokens, and `middleware.ts` emits CORS headers for `http://localhost:3002`.

### 4. admin-web (port 3002)

```bash
cp apps/admin-web/.env.example apps/admin-web/.env.local    # first time only
pnpm --filter @gjirafanews/admin-web dev
```

Open <http://localhost:3002>. You'll be redirected to Keycloak, sign in with the seeded admin, and land back on the dashboard.

## Environment variables

| Variable | Example | Used by |
|---|---|---|
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` | `src/lib/keycloak.ts` |
| `VITE_KEYCLOAK_REALM` | `gjirafanews` | `src/lib/keycloak.ts` |
| `VITE_KEYCLOAK_CLIENT_ID` | `admin-web` | `src/lib/keycloak.ts` |
| `VITE_API_URL` | `http://localhost:5283` | `src/lib/api.ts` (auth endpoints) |
| `VITE_CONTENT_API_URL` | `http://localhost:3000/api` | `src/lib/api.ts` (articles/categories/sources) |

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
