# GjirafaNews Monorepo

A news platform built as a pnpm monorepo: a Next.js public site, a Vite admin
dashboard, a .NET 10 API with realtime/messaging/storage features, and shared
TypeScript packages.

```
gjirafanews/
├── apps/
│   ├── api/          .NET 10 API + SignalR hubs + Kafka + Hangfire   → :5283
│   ├── api-tests/    xUnit + Moq + Testcontainers
│   ├── web/          Next.js 16 (App Router) public site             → :3000
│   └── admin/        Vite + React 19 admin dashboard                 → :3002
├── packages/
│   ├── api-client/   Typed fetch wrapper around the .NET API
│   ├── auth/         Keycloak config + Auth.js / SPA helpers
│   ├── types/        Shared TypeScript domain types
│   ├── ui/           Shared React components
│   └── utils/        Pure helpers (timeAgo, slugify, …)
├── infra/
│   ├── compose.yml   Single profile-driven Docker stack
│   ├── .env.example  Source of truth for compose env vars
│   ├── postgres/     init.sql
│   ├── grafana/      provisioning
│   └── keycloak/     realm-export.json (clients: web, admin-web)
└── docs/             architecture-changes.md, auth.md, plans/
```

The .NET API runs more than CRUD: Postgres + EF Core + Dapper, Redis caching,
Keycloak JWT auth, SignalR hubs (`/hubs/{notifications,chat,dashboard}`), S3
multipart uploads, MailKit email, Kafka producer/consumer, and Hangfire
scheduled jobs.

---

## Prerequisites

- **Node.js ≥ 20**
- **pnpm ≥ 10** — `npm install -g pnpm`
- **Docker Desktop** (Postgres, Keycloak, Kafka, MinIO, …)
- **.NET SDK 10** — only required if you want to run the API on the host
  instead of in Docker

---

## First-time setup

```pwsh
# 1. Clone + install JS workspace deps
pnpm install
pnpm approve-builds                     # answer "y" for esbuild, sharp, unrs-resolver

# 2. Create infra/.env from the template (used by docker compose)
copy infra\.env.example infra\.env

# 3. Generate a real AUTH_SECRET (any 32+ char string for dev) and paste it
#    into infra\.env on the AUTH_SECRET line.
node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
```

Then create per-app dev env files for the local frontend processes:

**`apps/web/.env.local`**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5283
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_REALM=gjirafanews
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=web
NEXT_PUBLIC_ADMIN_URL=http://localhost:3002
AUTH_SECRET=<paste the same value you put in infra/.env>
KEYCLOAK_CLIENT_SECRET=web-dev-secret-change-me
```

**`apps/admin/.env.local`**

```env
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=gjirafanews
VITE_KEYCLOAK_CLIENT_ID=admin-web
VITE_API_URL=http://localhost:5283
```

> `KEYCLOAK_CLIENT_SECRET` matches the dev secret committed to
> `infra/keycloak/realm-export.json`. Rotate both for any non-dev environment.

---

## Run it

The recommended dev workflow is **infrastructure + API in Docker, frontends
on the host** (host frontends get hot reload).

### 1. Boot the API stack

```pwsh
docker compose -f infra/compose.yml --profile api up -d
docker compose -f infra/compose.yml ps                  # all services healthy
```

This brings up the entire backend in one shot:

| Service     | Host port      | What                                       |
| ----------- | -------------- | ------------------------------------------ |
| postgres    | 5432           | App database                               |
| pgbouncer   | 6432           | Pooled connections                         |
| redis       | 6379           | Article cache                              |
| keycloak    | **8081**       | Identity provider (admin console at `/admin`) |
| keycloak-db | (internal)     |                                            |
| minio       | 9000 / 9001    | Local S3 + console (`minio` / `<MINIO_ROOT_PASSWORD>`) |
| kafka       | 9094 (host)    | Messaging (KRaft mode, single broker)      |
| papercut    | 2525 / 37408   | SMTP catcher + web UI                      |
| **api**     | **5283**       | The .NET API                               |

Sanity-check:

```pwsh
curl http://localhost:8081/realms/gjirafanews/.well-known/openid-configuration
curl http://localhost:5283/api/articles?page=1
curl http://localhost:5283/api/categories
curl http://localhost:5283/api/sources
```

### 2. Run the frontends (host, hot reload)

Two terminals:

```pwsh
# Terminal A — Next.js public site
pnpm --filter @gjirafanews/web dev          # http://localhost:3000

# Terminal B — Vite admin SPA
pnpm --filter @gjirafanews/admin dev        # http://localhost:3002
```

### 3. Log in

The Keycloak realm ships one seeded user (dev only):

| Email                       | Password    | Roles          |
| --------------------------- | ----------- | -------------- |
| `admin@gjirafanews.com`     | `admin123`  | `admin`, `user`|

- **Web** (`localhost:3000`) — click **Kyqu** in the navbar → redirected to
  Keycloak (`:8081`) → log in → bounced back to `/` with an Auth.js session.
- **Admin** (`localhost:3002`) — automatically redirected to Keycloak by
  `keycloak-js`.

---

## Alternative: everything in Docker

If you don't need hot reload, the `web` profile boots the frontends in
containers too:

```pwsh
docker compose -f infra/compose.yml --profile web up -d --build
```

Frontend dev-time env vars are baked at build time, so for hot reload you
want host execution as above.

---

## Compose profiles

| Profile         | Boots                                                  | Use                          |
| --------------- | ------------------------------------------------------ | ---------------------------- |
| `infra`         | postgres, pgbouncer, redis, keycloak, minio, kafka, papercut | Backing services only      |
| `api`           | infra + the .NET API                                   | Backend dev (run frontends on host) |
| `web`           | infra + api + web + admin                              | Full stack in containers     |
| `observability` | loki, grafana, kafka-ui                                | Optional logs + Kafka inspector |

---

## Scripts

| Command            | What it does                                |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Start all JS apps in parallel               |
| `pnpm dev:web`     | Start `web` only (`:3000`)                  |
| `pnpm dev:admin`   | Start `admin` only (`:3002`)                |
| `pnpm build`       | Build every workspace                       |
| `pnpm lint`        | Lint every workspace                        |
| `pnpm test`        | Run unit tests in every workspace           |
| `pnpm test:e2e`    | Run Playwright E2E in `web`                 |
| `pnpm format`      | Prettier across the repo                    |

.NET:

```pwsh
dotnet build apps/api/GjirafaNewsAPI.csproj
dotnet test  apps/api-tests/GjirafaNews.Tests.csproj
```

---

## Apps

### `apps/web` — Public site (Next.js 16)

App Router, Turbopack, server components for SSR. Auth via **Auth.js v5** +
Keycloak. Data via the shared `@gjirafanews/api-client`. Realtime SignalR
hooks for live chat, notifications, and the dashboard snapshot. Newsletter
emails through Resend.

### `apps/admin` — Admin dashboard (Vite + React 19)

React Router 7. Auth via `keycloak-js` (shared via `@gjirafanews/auth/spa`).
React Query for server state. CRUD for articles + categories + sources,
all going through the shared api-client.

### `apps/api` — .NET 10 backend

ASP.NET Core. REST controllers, SignalR hubs, Hangfire jobs, Kafka
producer/consumer, S3 multipart uploads, MailKit email, Redis caching,
Postgres + EF Core 10 (with snake_case naming + soft-delete + audit
interceptors). See [`docs/architecture-changes.md`](docs/architecture-changes.md)
for the full picture and [`docs/auth.md`](docs/auth.md) for the auth setup.

### `apps/api-tests`

xUnit + Moq + Testcontainers. Currently covers articles, categories, and
sources controllers.

---

## Shared packages

| Package                       | Role                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| `@gjirafanews/api-client`     | Typed fetch wrapper around the .NET API. One client for both apps. |
| `@gjirafanews/auth`           | Keycloak config, JWT helpers. Subpaths: `/spa`, `/nextauth`.       |
| `@gjirafanews/types`          | Shared TS domain types (`Article`, `Category`, …).                 |
| `@gjirafanews/ui`             | React components (`Button`, `Input`, `Modal`, `ArticlesTable`, …). |
| `@gjirafanews/utils`          | Pure helpers (`timeAgo`, `slugify`, `createIdGenerator`).          |

All packages currently ship raw `.ts`. The tsup build pipeline + Turborepo
graph is a deferred follow-up — see
[`docs/architecture-changes.md`](docs/architecture-changes.md) §10.

---

## Tech stack

| Layer            | Tool                                  |
| ---------------- | ------------------------------------- |
| Package manager  | pnpm 10                               |
| Public site      | Next.js 16, React 19, TypeScript      |
| Admin            | Vite 6, React Router 7                |
| API              | ASP.NET Core 10, EF Core 10           |
| Auth             | Keycloak 26 + Auth.js v5 (web) + keycloak-js (admin) |
| Realtime         | SignalR (`@microsoft/signalr`)        |
| DB               | Postgres 16 + PgBouncer + Redis       |
| Messaging        | Kafka 3.8 (KRaft mode)                |
| Background jobs  | Hangfire (Postgres backend)           |
| Object storage   | S3 — MinIO locally, swap-in for prod  |
| Email            | MailKit + Papercut catcher in dev     |
| Observability    | Serilog → Loki → Grafana              |
| JS tests         | Jest + Playwright                     |
| .NET tests       | xUnit + Moq + Testcontainers          |

---

## Troubleshooting

### Articles render with `null` category/source

The article repository wasn't `.Include()`ing nav properties on an older
build. If you've already cached bad results in Redis:

```pwsh
docker compose -f infra/compose.yml exec redis redis-cli FLUSHALL
docker compose -f infra/compose.yml restart api
```

### `invalid_redirect_uri` from Keycloak

The realm import only runs on first boot. If you change
`infra/keycloak/realm-export.json`, recreate the Keycloak DB volume so the
import re-runs:

```pwsh
docker compose -f infra/compose.yml down keycloak keycloak-db
docker volume rm gjirafanews_keycloak_db_data
docker compose -f infra/compose.yml --profile api up -d keycloak
```

### `Configuration is missing for provider type: keycloak` (web)

`apps/web/.env.local` doesn't have `KEYCLOAK_CLIENT_SECRET` and
`AUTH_SECRET`. See the [first-time setup](#first-time-setup) section.

### `Cannot read properties of null (reading 'id')` in `lib/data.ts`

Same root cause as the first item above — `category` or `source` came back
null from the API. Rebuild the API and flush Redis.

### CORS errors hitting the API from the browser

`API_CORS_ORIGINS` in `infra/.env` must include both `http://localhost:3000`
and `http://localhost:3002`. Restart the API after changing it.

### `tsc -b` fails on `packages/ui`

Pre-existing issue; the runtime build via Vite/Next still works because
they don't use `tsc` for type-checking. The proper fix is the deferred
tsup build pipeline.

---

## Documentation

- [`docs/architecture-changes.md`](docs/architecture-changes.md) — full audit + restructuring proposal + what's landed.
- [`docs/auth.md`](docs/auth.md) — Keycloak realm setup, callback URLs, role conventions, realm reset procedure.
- [`docs/plans/`](docs/plans/) — phased implementation plans + feature plans (categories, live-chat, multi-step form wizard).
- [`docs/conventions.md`](docs/conventions.md) — project-wide rules (naming, design tokens, language).

---

## Tear-down

```pwsh
# Stop everything, keep volumes
docker compose -f infra/compose.yml --profile api down
docker compose -f infra/compose.yml --profile web down

# Wipe all data (Postgres, Keycloak, MinIO, Kafka)
docker compose -f infra/compose.yml --profile web down -v
```
