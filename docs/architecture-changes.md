# Architecture Changes — Proposal

Audit of `gjirafanews` against `main` (`HEAD = 42a116e`, after pulling
S3 / Kafka / Hangfire / SignalR / file-handling work). Findings are grouped by
area; each item is **Observation → Proposal** so it can be accepted or rejected
piece-by-piece.

Repo at audit time:

```
gjirafanews-monorepo/
├── apps/
│   ├── GjirafaNews/            .NET 10 API (Articles + Chat/Notifications/Files/Email/Kafka/Hangfire)
│   │   ├── GjirafaNewsAPI/
│   │   ├── KafkaConsumer/      sibling .NET service consumed via compose
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.override.yml
│   │   ├── docker-compose.dcproj
│   │   └── grafana/, init.sql
│   ├── GjirafaNews.Tests/      xUnit project
│   ├── admin-web/              Vite + React + Keycloak  (production admin)
│   ├── admin-web2/             Next.js — abandoned admin rewrite, no auth
│   ├── gjirafa-news/           Next.js public site — actively developed
│   └── pulse-news/             Next.js — frozen snapshot of public site, lacks new features
├── packages/
│   ├── types/  ui/  utils/
├── infra/
│   └── keycloak/realm-export.json
├── docker-compose.keycloak.yml          (root — only Keycloak + its DB)
├── docker-compose.dcproj                (Visual Studio Compose project)
├── package-lock.json + pnpm-lock.yaml   (two lockfiles)
└── PROJECT_RULES.md, TEST_REPORT.md, AGENTS.md, CLAUDE.md
```

The API now spans much more than CRUD — SignalR realtime, S3 multipart uploads,
SMTP via MailKit, Kafka producer/consumer, and Hangfire scheduled jobs all live
in one process. The proposals below take that into account.

---

## 1. Docker / Infrastructure

### 1.1 Three compose files, two of them in an app folder

**Observation**

- `docker-compose.keycloak.yml` (root) — Keycloak + Keycloak DB only.
- `apps/GjirafaNews/docker-compose.yml` — API + 9 backing services
  (postgres, pgbouncer, redis, kafka, kafka-ui, kafka-consumer, papercut SMTP,
  loki, grafana).
- `apps/GjirafaNews/docker-compose.override.yml` — auto-merged when running
  compose from that directory; injects S3/CDN77 env vars and mounts
  `${APPDATA}/Microsoft/UserSecrets` (Windows-only path).
- Both Keycloak and the API publish host port `8080` — they cannot run
  simultaneously as written.
- None of `gjirafa-news`, `pulse-news`, `admin-web`, `admin-web2` are defined in
  any compose file.
- Backing infra (`init.sql`, `grafana/provisioning/`) lives **inside** an app
  folder, not in `infra/`.

**Proposal**

Move everything to `infra/` and consolidate into a single compose stack with
profiles so devs run only what they need:

```
infra/
├── compose.yml                      ← single source of truth
├── compose.override.yml              ← optional dev-only overrides
├── .env.example
├── postgres/init.sql                 (moved from apps/GjirafaNews/)
├── pgbouncer/
├── redis/
├── kafka/
├── minio/                            (new — local S3, see §1.4)
├── papercut/
├── loki/
├── grafana/provisioning/             (moved from apps/GjirafaNews/grafana/)
└── keycloak/realm-export.json        (already here)
```

Profiles:

| Profile         | Services                                                                  | Use case                       |
| --------------- | ------------------------------------------------------------------------- | ------------------------------ |
| `infra`         | postgres, pgbouncer, redis, keycloak, keycloak-db, minio, papercut, kafka | Devs running apps locally      |
| `api`           | infra + api + kafka-consumer                                              | Backend-only dev               |
| `web`           | infra + api + web + admin                                                 | Full stack in containers       |
| `observability` | loki, grafana, kafka-ui                                                   | Optional logging/inspection    |

Run with `docker compose --profile web up`.

Fix the port clash: Keycloak → host `8081`; API → host `5283` (matches the
`launchSettings.json` dev profile).

Add Dockerfiles for the two missing frontends (`apps/<web|admin>/Dockerfile`).

### 1.2 Production S3 bucket configured for dev

**Observation** — `docker-compose.override.yml` lines 8–14 set
`S3__ServiceUrl=https://eu-1.cdn77-storage.com`, `S3__Bucket=florent`,
`S3__PublicRead=true`. AWS keys are empty (relying on Windows User Secrets via
`${APPDATA}` mount, which doesn't exist on macOS/Linux). Devs on non-Windows
machines either get mount errors or end up writing to a real production bucket
with whatever creds are in their environment.

**Proposal** — Run **MinIO** locally as the default S3 backend. CDN77 stays
available, but only when explicitly toggled via `infra/.env`. Drop the
`${APPDATA}` mount; standardize on env-based credentials in `infra/.env`.

```yaml
# infra/compose.yml (excerpt)
minio:
  profiles: [infra, api, web]
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${MINIO_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
  ports: ["9000:9000", "9001:9001"]
  volumes: [minio_data:/data]

minio-init:
  image: minio/mc
  depends_on: [minio]
  entrypoint: |
    sh -c "until mc alias set local http://minio:9000 $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD; do sleep 1; done;
           mc mb -p local/${S3_BUCKET} && mc anonymous set download local/${S3_BUCKET}"
```

Adjust `appsettings.Development.json` so `S3:ServiceUrl=http://minio:9000`,
`S3:ForcePathStyle=true`, `S3:Region=us-east-1`.

### 1.3 Hardcoded "secret" passwords + missing services in compose

**Observation**

- `Password=secret` in `docker-compose.yml:34,54`, `keycloak.yml:8,30`, and
  `appsettings.Development.json:13`.
- API depends on Keycloak (JWT validation) but no Keycloak service in the API's
  compose file.
- `appsettings.Development.json` has `ConnectionStrings:Redis=localhost:6379`
  while compose-internal services should use `redis:6379`. Mismatched depending
  on whether the API runs on the host or in a container.

**Proposal** — Single `infra/.env` (gitignored) for every credential, with
`infra/.env.example` committed. Reference everywhere as `${VAR}`. Move Keycloak
into the consolidated compose (§1.1). Inside compose, services use container
hostnames (`redis`, `pgbouncer`, `kafka`); host-side dev points to `localhost`.

### 1.4 Hangfire dashboard is unauthenticated

**Observation** — `Program.cs:132–136` mounts `/hangfire` with no
`DashboardAuthorizationFilter`. The `IDashboardAuthorizationFilter` API exists
specifically to gate this endpoint. As written, anyone who can reach the API
can browse and trigger background jobs.

**Proposal** — Add a filter that requires the `admin` Keycloak role:

```csharp
app.UseHangfireDashboard("/hangfire", new DashboardOptions {
    Authorization = new[] { new AdminOnlyDashboardFilter() },
    IsReadOnlyFunc = ctx => !ctx.GetHttpContext().User.IsInRole("admin"),
});
```

`AdminOnlyDashboardFilter` reads the JWT from the request (Hangfire calls into
`HttpContext`) and checks for the `admin` realm role.

### 1.5 init.sql lives in the API folder and references EF tables

**Observation** — `apps/GjirafaNews/init.sql` runs at postgres first-boot and
intentionally creates only `article_views`; the rest is created later by EF
migrations. This split is documented in a long comment.

**Proposal** — When `init.sql` moves to `infra/postgres/`, take the next step:
fold the trending-articles stored proc into an EF migration so the schema lives
in exactly one place. `init.sql` becomes either empty (and gets deleted) or
holds only DB-server-level setup (extensions, roles).

### 1.6 KafkaConsumer is a sibling project, not a worker in the API

**Observation** — `apps/GjirafaNews/KafkaConsumer/Dockerfile` exists; compose
defines a `kafka-consumer` service. Meanwhile, the API itself already runs
`KafkaConsumerWorker` as a hosted service. So there are **two** consumers in
different consumer groups.

**Proposal** — Decide which is the source of truth and delete the other.
Recommendation: keep the in-API hosted service (single deployable, simpler
operations); drop the standalone consumer. If the standalone is meant to scale
out independently, that's a different conversation — but at this size it's
duplication.

### 1.7 grafana port mapping is wrong

**Observation** — `grafana` maps `3300:3300` but Grafana listens on `3000`
inside the container by default. The mapping silently doesn't expose anything.

**Proposal** — `3300:3000`. Already noted; trivial fix.

---

## 2. Monorepo Layout & Conventions

### 2.1 Two public sites, two admin apps

**Observation**

| App           | Framework         | Port | Active features                                                                                  |
| ------------- | ----------------- | ---- | ------------------------------------------------------------------------------------------------ |
| `gjirafa-news`| Next.js 16        | 3000 | SignalR realtime, dashboard, notifications, uploads, send-email, multi-step contact form, Resend |
| `pulse-news`  | Next.js 16        | 3001 | None of the above. No `@microsoft/signalr`, no `resend`. Frozen snapshot.                        |
| `admin-web`   | Vite + React 19   | 3002 | Keycloak (`keycloak-js`), full CRUD via React Query.                                             |
| `admin-web2`  | Next.js 16        | 3003 | No Keycloak, no auth wired, abandoned mid-rewrite.                                               |

Two of these are dead weight: `pulse-news` lags behind every feature added
since realtime landed, and `admin-web2` was an admin rewrite that never got
auth. Only `c7c8100` tried to delete them — it was discarded during the recent
pull.

**Proposal** — Delete both:

```bash
git rm -r apps/pulse-news apps/admin-web2
```

Update root scripts, `pnpm-workspace.yaml` is already wildcarded. Remove
references in `README.md`. If pulse-news was a "demo / staging variant," that's
better served by branches or `--profile demo` in compose, not by carrying a
forked copy in `main`.

### 2.2 Inconsistent app naming + nested API folder

**Observation**

- `apps/GjirafaNews/` — PascalCase, contains `GjirafaNewsAPI/`,
  `KafkaConsumer/`, `docker-compose.yml`, `grafana/`, `init.sql`.
- `apps/GjirafaNews.Tests/` — sibling, dot-namespaced.
- `apps/gjirafa-news/`, `apps/admin-web/` — kebab-case.
- On macOS (case-insensitive default), `apps/gjirafa-news` and
  `apps/GjirafaNews` are nearly indistinguishable.

**Proposal** — After §1.1 moves compose/grafana/init.sql out:

```
apps/
├── api/                     (was apps/GjirafaNews/GjirafaNewsAPI)
├── api-tests/               (was apps/GjirafaNews.Tests)
├── kafka-consumer/          (was apps/GjirafaNews/KafkaConsumer — only if §1.6 keeps it)
├── admin/                   (was apps/admin-web)
└── web/                     (was apps/gjirafa-news)
```

Folder names stay kebab-case. Inside `apps/api/` the `.csproj` and namespaces
remain `GjirafaNewsAPI` (idiomatic .NET; renaming triggers churn through every
`using` statement). Drop the now-empty outer `apps/GjirafaNews/`.

### 2.3 Stale README

**Observation** — `README.md` documents pulse-news and admin-web2 as
first-class apps. Random tail content (SSE/WS demo links) is unrelated to the
project. No mention of S3, Kafka, Hangfire, SignalR.

**Proposal** — Rewrite after the reorg lands. Keep slim, link out to `docs/`:

```
docs/
├── architecture-changes.md      (this file)
├── architecture.md              (current-state diagram once changes land)
├── runbook.md                   (start/stop/seed locally)
├── api-conventions.md           (ApiResponse envelope, error shape)
├── auth.md                      (Keycloak realm + flow per app)
├── realtime.md                  (SignalR hubs + client wiring)
├── jobs.md                      (Hangfire jobs, schedules, dashboard auth)
├── messaging.md                 (Kafka topics + consumer groups)
└── storage.md                   (S3 layout, multipart flow, MinIO dev setup)
```

### 2.4 Two lockfiles

**Observation** — `pnpm-lock.yaml` and `package-lock.json` both at the root.
Root `package.json` mixes `pnpm -r` with `npm run -w` invocations. README says
pnpm.

**Proposal** — Delete `package-lock.json`. Standardize on pnpm everywhere; add
a `packageManager` field and a `preinstall` guard:

```jsonc
{
  "packageManager": "pnpm@10",
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "dev":      "pnpm -r --parallel run dev",
    "dev:web":  "pnpm --filter @gjirafanews/web dev",
    "dev:admin":"pnpm --filter @gjirafanews/admin dev",
    "build":    "pnpm -r run build",
    "lint":     "pnpm -r run lint",
    "test":     "pnpm -r run test"
  }
}
```

### 2.5 No build orchestrator

**Observation** — `pnpm -r --parallel run dev` works but has no caching, no
task graph awareness, no remote cache. Now that there are multiple
publishable-style packages with build steps coming (§3.1), this hurts.

**Proposal** — Add **Turborepo**. ~10 lines of `turbo.json`, hooks into the
existing scripts.

### 2.6 Files committed that shouldn't be

**Observation**

| Path                                                  | Issue                              |
| ----------------------------------------------------- | ---------------------------------- |
| `apps/gjirafa-news/dev.db`                            | SQLite tracked                     |
| `apps/pulse-news/dev.db`                              | SQLite tracked                     |
| `apps/gjirafa-news/test-results/`                     | Playwright artifacts tracked       |
| `apps/gjirafa-news/CATEGORIES-PLAN.md`                | Feature planning doc (16 KB)       |
| `apps/gjirafa-news/LIVE-CHAT-PLAN.md`                 | Feature planning doc (14 KB)      |
| `apps/gjirafa-news/MULTI-STEP-FORM-WIZARD-PLAN.md`   | Feature planning doc (26 KB)      |
| `apps/admin-web/dist/`                                | Build output tracked               |
| `apps/admin-web/.env.local`                           | Local env tracked                  |
| Root `TEST_REPORT.md`                                 | Snapshot doc                       |
| `package-lock.json`                                   | Conflicts with pnpm                |

**Proposal** — Add to `.gitignore`:

```gitignore
**/dev.db
**/*.sqlite
**/test-results/
**/playwright-report/
**/dist/
**/coverage/
.env
.env.local
.env.*.local
```

Move plan docs to `docs/plans/`. Delete tracked artifacts. Replace
`apps/admin-web/.env.local` with `.env.example`. Delete `TEST_REPORT.md`
(replace with CI test reports, see §7).

### 2.7 Root noise

**Observation** — Root has `PROJECT_RULES.md` (15 KB), `TEST_REPORT.md` (28 KB),
`AGENTS.md`, `CLAUDE.md` (the latter just `@AGENTS.md`).

**Proposal** — Keep `AGENTS.md` and `CLAUDE.md`. Move `PROJECT_RULES.md` →
`docs/conventions.md`. Delete `TEST_REPORT.md`.

---

## 3. Shared Packages (`packages/*`)

### 3.1 Packages export raw `.ts`

**Observation** — All three packages set `main`/`exports` to `./src/index.ts(x)`
with no build step, no `types` field, no `exports` map. Works inside the
monorepo because Next.js / Vite transpile workspace deps; breaks in any other
context.

**Proposal** — Add `tsup` per package, with a proper `exports` map. Same
pattern as before:

```jsonc
{
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": { "build": "tsup", "dev": "tsup --watch", "clean": "rimraf dist" }
}
```

Once packages ship `dist`, drop them from `transpilePackages` in
`apps/web/next.config.ts` and from `moduleNameMapper` in `jest.config.ts`.

### 3.2 `@gjirafanews/ui` not used by the public site

**Observation** — `gjirafa-news` declares `@gjirafanews/ui` as a dep,
configures it in `next.config.ts` and `jest.config.ts`, but **never imports a
single component from it**. It builds `news-card`, `save-button`, `navbar`,
contact-wizard, chat components, etc. locally.

**Proposal** — Adopt the shared package: rebuild the public site's primitives
(Button, Modal, Input, Select, Textarea) on top of `@gjirafanews/ui` so admin
and public site share a visual language. Compound components
(news-card, contact-wizard) stay in `apps/web` — they're product-specific.

### 3.3 `timeAgo()` has a formatting bug

**Observation** — `packages/utils/src/index.ts:33–35` returns
`"5hours ago"` / `"2days ago"` (missing space).

**Proposal** — Replace with `Intl.RelativeTimeFormat("sq-AL")`. Add unit tests.

### 3.4 Missing shared packages — now even more obvious

**Observation** — Both apps reimplement these concerns, and the additions in
the recent feature work made the duplication worse:

| Concern             | `web` (Next.js)                                    | `admin` (Vite)                            |
| ------------------- | -------------------------------------------------- | ----------------------------------------- |
| API client          | `lib/store/` (RTK Query)                           | `lib/api.ts` (React Query)                |
| Auth/session        | bcrypt + jose sessions (homegrown)                 | `keycloak-js`                             |
| **Realtime client** | `lib/dashboard-hub.ts`, `notifications-context.tsx`, ad-hoc `HubConnection` setups | not yet used (admin doesn't subscribe to hubs)         |
| **S3 upload helper**| `lib/uploads.ts` (multipart from the browser)      | not yet used                              |
| Email templates     | `lib/email-templates/`                             | n/a                                       |
| Tailwind tokens     | inline                                             | inline                                    |
| ESLint config       | `eslint.config.mjs` (per app)                      | (none)                                    |

**Proposal** — Add packages incrementally as duplication grows. First three
pay for themselves immediately:

```
packages/
├── api-client/      typed fetch around the .NET API (uses @gjirafanews/types)
├── auth/            Keycloak setup + token utils + role helpers
├── realtime/        SignalR HubConnection factory + typed hub clients (chat, notifications, dashboard)
├── config-eslint/   shared eslint flat-config preset
├── config-ts/       tsconfig presets (replaces tsconfig.base.json)
└── tailwind-preset/ gn-* tokens + plugin set
```

`realtime` becomes important when `admin` starts consuming notifications too
— right now only `web` uses SignalR, but admin needs presence/notification
delivery for any reasonable admin UX.

### 3.5 Useful helpers in apps that should live in `packages/utils`

**Observation** — `apps/gjirafa-news/lib/data.ts` defines `slugify()`. Likely
others scattered.

**Proposal** — Pull out as `packages/utils` grows. Add a per-function test
file convention (set during the `timeAgo` fix).

---

## 4. .NET API (`apps/GjirafaNews/GjirafaNewsAPI`)

### 4.1 `Program.cs` is becoming a kitchen sink

**Observation** — `Program.cs` (~330 lines) wires Serilog + Loki, EF + Dapper +
interceptors, Redis, Keycloak JWT, CORS, S3, Email, Kafka producer/consumer,
Hangfire (with recurring job registration), SignalR hubs, Swagger, exception
middleware. One `Main` does all of it, with private static helpers
(`ConfigureKeycloakAuth`, `ConfigureCors`, `ConfigureS3Storage`,
`ConfigureEmail`, `ConfigureKafka`, `ConfigureHangfire`).

**Proposal** — Extract each `Configure*` into an extension method on
`IServiceCollection` under `Infrastructure/Extensions/`:

```csharp
// Infrastructure/Extensions/StorageServiceCollectionExtensions.cs
public static IServiceCollection AddS3Storage(this IServiceCollection services, IConfiguration cfg) { ... }
```

`Program.cs` becomes a thin composition root. Easier to test, easier to read,
easier to grow.

### 4.2 Tests project barely populated

**Observation** — `apps/GjirafaNews.Tests/` has folders (Controllers,
Repositories, Infrastructure) and a csproj that already references the API
csproj and pulls in `Testcontainers.PostgreSql`, `xunit`, `Moq`. The test
files inside are sparse.

**Proposal** — Add at least:

- `WebApplicationFactory`-based smoke test that boots the full DI graph against
  Testcontainers Postgres + an in-memory Kafka substitute.
- One contract test per controller.
- A Hangfire job test that schedules and asserts execution.

Hook `dotnet test` into root scripts and CI (§7).

### 4.3 CORS still hardcoded as a single origin in code

**Observation** — `Program.cs` reads `Cors:AdminWebOrigin` (single value).
With multiple frontends (web, admin) and prod/staging URLs, one origin isn't
enough.

**Proposal** — Switch to `Cors:AllowedOrigins` (comma-separated list):

```csharp
var origins = (cfg["Cors:AllowedOrigins"] ?? "http://localhost:3000,http://localhost:3002")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
options.AddPolicy(CorsPolicy, p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod());
```

For SignalR, `AllowCredentials()` plus exact origins is required (wildcard is
not allowed with credentials).

### 4.4 Notifications and ChatMessages skip the soft-delete interceptor

**Observation** — Soft-delete and audit interceptors apply via
`AppDbContext` but the new `notifications` and `chat_messages` tables don't
have `is_deleted` / `created_at` / `updated_at` columns wired up the same way.

**Proposal** — Decide per-table whether soft-delete applies. Notifications
probably should (audit trail), chat messages probably shouldn't (privacy:
delete = delete). Document the rule in `docs/api-conventions.md`.

### 4.5 Visual Studio artifacts

**Observation** — `GjirafaNews.slnx`, `docker-compose.dcproj`, two
`launchSettings.json` copies, `.vs/` (in `.gitignore` already).

**Proposal** — Keep `.slnx` and one `launchSettings.json`. Delete
`docker-compose.dcproj` once compose moves to `infra/`. Remove the
`<DockerComposeProjectPath>..\docker-compose.dcproj</DockerComposeProjectPath>`
line from `GjirafaNewsAPI.csproj`.

---

## 5. Public Site (`apps/gjirafa-news`)

### 5.1 Two parallel auth systems

**Observation**

- Keycloak is provisioned (realm export, compose service).
- `admin-web` uses Keycloak via `keycloak-js`.
- `gjirafa-news` has its own `/api/auth/{login,logout,register,me}` using
  `bcryptjs` against a hardcoded user list, with `jose`-encrypted session
  cookies.
- `lib/auth-guard.ts` references `KEYCLOAK_ISSUER` but never reads it — dead
  code.

**Proposal** — Pick Keycloak everywhere. Use **Auth.js v5** with the Keycloak
provider for `web` (idiomatic for App Router + middleware). Delete
`app/api/auth/*`, `lib/session.ts`, `lib/session-edge.ts`, `lib/auth-guard.ts`.
The shared `packages/auth` covers both apps.

When `web` switches to Keycloak, the JWT becomes the same identity that
SignalR hubs already require — no separate auth wiring for realtime.

### 5.2 Mock data sitting next to real API routes

**Observation** — `app/api/articles`, `/api/categories`, `/api/sources`,
`/api/chat` (the old one) return hardcoded data from `lib/data.ts`. The .NET
API owns those resources for real now.

**Proposal** — Choose one ownership pattern per resource:

- **Articles, Categories, Sources, Chat history, Notifications** — owned by
  .NET API. Delete the Next.js mock routes; fetch from API directly via the
  new `packages/api-client`.
- **Newsletter** (Resend) — keep in Next.js.
- **Send-email page** (`/send-email`) — currently calls the .NET API
  (`/api/emails`), keep that wiring.

This also kills the dual-base hack in `admin-web/lib/api.ts` (auth API base +
content API base).

### 5.3 Scattered env handling

**Observation** — Hardcoded `localhost` in 5+ files; `process.env.X` consumed
inline; no startup validation; new vars from S3/SignalR/Kafka work scattered
across components.

**Proposal** — `apps/web/lib/env.ts` validates `process.env` once at boot via
`zod`. Same pattern for `admin` (Vite's `import.meta.env`). Same for the .NET
API (formalize via `IOptions<T>` for each section: `S3Options`, `KafkaOptions`,
`EmailOptions`, `HangfireOptions`).

### 5.4 SignalR connection management is ad-hoc

**Observation** — `lib/dashboard-hub.ts`, `notifications-context.tsx`, and
several components each instantiate `HubConnectionBuilder` with subtly
different config (auto-reconnect intervals, log levels, transport fallback
order).

**Proposal** — Centralize in `packages/realtime`:

```ts
// packages/realtime/src/index.ts
export function createHubConnection(hubName: string, getToken: () => string | null) { ... }
export function useNotificationsHub() { ... }
export function useDashboardHub() { ... }
export function useChatHub() { ... }
```

Apps call `useNotificationsHub()` and get a typed, properly-reconnecting
connection. Tokens come from the auth package (§3.4).

---

## 6. Admin Web (`apps/admin-web`)

### 6.1 Dual API base

**Observation** — `lib/api.ts` calls two backends: `VITE_API_URL` (.NET) and
`VITE_CONTENT_API_URL` (Next.js). Sticky tape from a partial migration.

**Proposal** — After §5.2, single base URL. Delete `CONTENT_API_URL`. The
shared `packages/api-client` makes this one configuration knob.

### 6.2 Admin doesn't use realtime yet

**Observation** — Admin handles articles + Keycloak only. Notifications,
chat moderation, online-user counts (which exist server-side) aren't
surfaced.

**Proposal** — Once `packages/realtime` lands (§3.4 / §5.4), wire admin into
`useNotificationsHub` and `useDashboardHub` for at least the dashboard
landing page. Out of scope for the structural reorg, but worth noting as a
follow-up.

### 6.3 `.env.local` and `dist/` tracked

**Observation** — Both committed. No `.gitignore` excludes them.

**Proposal** — Add to `.gitignore`, commit `.env.example`, remove from history.

---

## 7. CI / Tooling

### 7.1 No CI

**Observation** — No `.github/workflows/`. Nothing runs on push or PR.

**Proposal** — `.github/workflows/ci.yml` with three jobs:

- **`js`** — pnpm install, `turbo run lint test build`. Postgres service for
  any integration tests.
- **`dotnet`** — `dotnet build`, `dotnet test` against a Postgres service.
  Testcontainers handles the rest internally.
- **`e2e`** — Playwright on the built web app. Spin up minimal compose
  (`infra` + `api` + `web`) via the new `infra/compose.yml`.

Branch protection on `main` requires all three.

### 7.2 No shared eslint / tsconfig presets

**Observation** — Per-app eslint config; one root `tsconfig.base.json`
extended by all packages but not consistently by all apps.

**Proposal** — Move TS presets to `packages/config-ts/`
(`base.json`, `nextjs.json`, `react-lib.json`, `node-lib.json`,
`vite.json`). Each app/package extends the right preset. Same for eslint via
`packages/config-eslint`.

---

## 8. Suggested Final Tree

```
gjirafanews-monorepo/
├── apps/
│   ├── api/                           (was apps/GjirafaNews/GjirafaNewsAPI)
│   │   ├── Dockerfile
│   │   ├── GjirafaNewsAPI.csproj
│   │   ├── Program.cs                 (slim composition root)
│   │   ├── Controllers/  Hubs/  Services/  Domain/  …
│   │   └── Infrastructure/Extensions/  (S3, Kafka, Hangfire, Email modules)
│   ├── api-tests/                     (was apps/GjirafaNews.Tests)
│   ├── kafka-consumer/                (only if §1.6 keeps it standalone)
│   ├── admin/                         (was apps/admin-web)
│   │   └── Dockerfile (new)
│   └── web/                           (was apps/gjirafa-news)
│       └── Dockerfile (new)
├── packages/
│   ├── api-client/                    (new)
│   ├── auth/                          (new)
│   ├── realtime/                      (new)
│   ├── config-eslint/                 (new)
│   ├── config-ts/                     (new)
│   ├── tailwind-preset/               (new)
│   ├── types/  ui/  utils/
├── infra/
│   ├── compose.yml                    (single, profile-driven)
│   ├── compose.override.yml
│   ├── .env.example
│   ├── postgres/init.sql
│   ├── pgbouncer/  redis/  kafka/  papercut/  loki/
│   ├── minio/                         (new — local S3)
│   ├── grafana/provisioning/
│   └── keycloak/realm-export.json
├── docs/
│   ├── architecture-changes.md        (this doc)
│   ├── plans/                         (PR plans + feature plans)
│   ├── architecture.md
│   ├── runbook.md
│   ├── auth.md
│   ├── api-conventions.md
│   ├── realtime.md
│   ├── jobs.md
│   ├── messaging.md
│   └── storage.md
├── .github/workflows/ci.yml
├── AGENTS.md  CLAUDE.md  README.md
├── package.json  pnpm-lock.yaml  pnpm-workspace.yaml
└── turbo.json                         (new)
```

### Apps deleted

- `apps/pulse-news/` (frozen snapshot, no unique features)
- `apps/admin-web2/` (abandoned admin rewrite, no auth)

---

## 9. Migration Order

The proposals above don't all need to land at once. Suggested order so each
step ships value and unblocks the next. The full per-PR breakdown lives in
[`docs/plans/architecture-changes-plan.md`](plans/architecture-changes-plan.md).

1. **Hygiene + delete deprecated apps** — `.gitignore`, untrack tracked
   artifacts, delete `pulse-news` + `admin-web2`, drop `package-lock.json`,
   clean root scripts, refresh README.
2. **Move infra** — single `infra/compose.yml` with profiles, MinIO for local
   S3, port unification, `.env`. Add Dockerfiles for `web` and `admin`.
3. **Rename apps** — `apps/GjirafaNews/...` → `apps/api`, etc.
4. **Fix `timeAgo` + tests in `packages/utils`** — quick win, sets the package
   testing pattern.
5. **Build pipeline** — `tsup` for each package, fix `exports` maps, add
   Turborepo.
6. **`Program.cs` decomposition + Hangfire dashboard auth** — extract
   `Configure*` helpers, add admin-only filter for `/hangfire`.
7. **Auth consolidation** — `packages/auth`; switch `web` to Keycloak via
   Auth.js; delete bcrypt path.
8. **API consolidation** — `packages/api-client`; delete Next.js mock routes
   for articles/categories/sources; admin gets a single base URL.
9. **Realtime consolidation** — `packages/realtime`; centralize SignalR
   wiring; admin starts subscribing to hubs.
10. **CI** — `.github/workflows/ci.yml`, branch protection.

Each step is independently revertible. Steps 1–4 are safe in any order; 5+
build on the renames in step 3.
