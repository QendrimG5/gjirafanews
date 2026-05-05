# Architecture Changes — Implementation Plan

Companion to [`docs/architecture-changes.md`](../architecture-changes.md). That
doc is the **what** and **why**; this is the **how** — concrete files,
commands, validation, rollback per phase.

The work is split into 10 PRs, ordered so each is independently shippable and
revertible. Phases 1–4 can land in any order; 5+ depend on the renames in
phase 3.

> **Conventions**
>
> - 📁 = create  ✏️ = modify  🗑️ = delete  📦 = move
> - "Validate" = the gate that must be green before merging
> - Every PR finishes with `git status` clean and `pnpm install && pnpm -r run build` green (plus `dotnet build` for .NET-touching PRs)

---

## Reference: target port map

The current compose files have a port-8080 collision (API + Keycloak) and
several services that aren't reachable from the host. Lock the table below in
during phase 2 and reference it everywhere afterwards.

| Service       | Container port | Host port | Notes                                          |
| ------------- | -------------- | --------- | ---------------------------------------------- |
| `web` (Next)  | 3000           | 3000      |                                                |
| `admin`       | 80 (nginx)     | 3002      | served from built `dist/`                      |
| `api` (.NET)  | 8080           | **5283**  | matches dev `launchSettings.json`              |
| `keycloak`    | 8080           | **8081**  | resolves the collision                         |
| `postgres`    | 5432           | 5432      |                                                |
| `pgbouncer`   | 6432           | 6432      |                                                |
| `redis`       | 6379           | 6379      |                                                |
| `kafka`       | 9092 / 9094    | 9092 / 9094 | KRaft mode, no ZK                            |
| `kafka-ui`    | 8080           | 8090      |                                                |
| `papercut`    | 25 / 80        | 2525 / 37408 | SMTP catcher + web UI                       |
| `minio`       | 9000 / 9001    | 9000 / 9001 | new — local S3 (see phase 2)                 |
| `loki`        | 3100           | 3100      |                                                |
| `grafana`     | 3000           | 3300      | fix: was `3300:3300` (broken)                  |

---

## Phase 1 — Hygiene + delete deprecated apps (~2 hours)

### Goal

Clean tracked artifacts. Delete `pulse-news` and `admin-web2`. Standardize on
pnpm. Refresh the README so it matches reality.

### Changes

**🗑️ Delete deprecated apps:**

```bash
git rm -r apps/pulse-news
git rm -r apps/admin-web2
```

**🗑️ Untrack but keep on disk (artifacts):**

```bash
git rm -r --cached apps/gjirafa-news/dev.db
git rm -r --cached apps/gjirafa-news/test-results
git rm -r --cached apps/admin-web/dist
git rm --cached apps/admin-web/.env.local
git rm package-lock.json
git rm TEST_REPORT.md
```

**📦 Move planning docs and conventions:**

```bash
git mv apps/gjirafa-news/CATEGORIES-PLAN.md             docs/plans/categories.md
git mv apps/gjirafa-news/LIVE-CHAT-PLAN.md              docs/plans/live-chat.md
git mv apps/gjirafa-news/MULTI-STEP-FORM-WIZARD-PLAN.md docs/plans/multi-step-form-wizard.md
git mv PROJECT_RULES.md                                 docs/conventions.md
```

**✏️ `.gitignore`** — append:

```gitignore
# local databases
**/dev.db
**/*.sqlite
**/*.sqlite-journal

# build outputs
**/dist/
**/build/

# test artifacts
**/test-results/
**/playwright-report/
**/coverage/

# env files
.env
.env.local
.env.*.local

# turbo
.turbo/
```

**📁 `apps/admin-web/.env.example`** — same shape as the deleted `.env.local`,
dummy values, with the new Keycloak port (8081):

```env
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=gjirafanews
VITE_KEYCLOAK_CLIENT_ID=admin-web
VITE_API_URL=http://localhost:5283
VITE_CONTENT_API_URL=http://localhost:3000/api
```

> `VITE_CONTENT_API_URL` is removed entirely in phase 8; for now we just
> commit the example so onboarding works.

**✏️ `package.json` (root)** — add `packageManager`, drop dead scripts, add
`only-allow` guard:

```json
{
  "name": "gjirafanews-monorepo",
  "private": true,
  "packageManager": "pnpm@10",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "dev":        "pnpm -r --parallel run dev",
    "dev:web":    "pnpm --filter @gjirafanews/gjirafa-news dev",
    "dev:admin":  "pnpm --filter @gjirafanews/admin-web dev",
    "build":      "pnpm -r run build",
    "lint":       "pnpm -r run lint",
    "test":       "pnpm -r run test",
    "test:e2e":   "pnpm --filter @gjirafanews/gjirafa-news test:e2e",
    "format":     "prettier --write \"**/*.{ts,tsx,js,mjs,json}\""
  }
}
```

Removed: `dev:gjirafa`, `dev:pulse`, `dev:admin`, `dev:admin2`, `start`.

**✏️ `README.md`** — strip every reference to `pulse-news` and `admin-web2`
(routes table, port map, scripts, workspace deps, tech stack). Replace the
random tail content (SSE/WS demo links) with a link to
`docs/plans/live-chat.md`. Add a brief note about the new server features
(SignalR realtime, S3 uploads, Hangfire jobs, Kafka, MailKit email).

### Validate

```bash
pnpm install                                          # lockfile re-resolves
pnpm -r run build                                     # all workspaces still build
git ls-files | grep -E '(pulse-news|admin-web2|dev\.db|test-results|admin-web/dist|\.env\.local|TEST_REPORT|package-lock)'  # empty
```

### Rollback

`git revert <commit>`. The deletion of `pulse-news` and `admin-web2` is the
biggest blast radius; recover from the previous commit if needed.

### Risk

Low-medium. Deleting two apps is a real deletion — confirm with the team that
nobody is mid-flight on either of those before merging.

---

## Phase 2 — Consolidate infra (~1 day)

### Goal

One `infra/` folder, one compose file, profile-driven boot, MinIO for local S3
so devs aren't hitting CDN77 by accident. Frontends get Dockerfiles.

### File plan

**📁 `infra/.env.example`:**

```env
# ── Postgres (app DB) ────────────────────────────────────────────────────
POSTGRES_USER=gjirafanews
POSTGRES_PASSWORD=change-me
POSTGRES_DB=gjirafanews

# ── Keycloak ─────────────────────────────────────────────────────────────
KC_DB_USER=keycloak
KC_DB_PASSWORD=change-me
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=change-me

# ── MinIO (local S3) ─────────────────────────────────────────────────────
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=change-me-min-8-chars
S3_BUCKET=gjirafanews

# ── API connection strings ──────────────────────────────────────────────
API_PG_CONN=Host=postgres;Port=5432;Database=gjirafanews;Username=gjirafanews;Password=change-me
API_PG_HANGFIRE_CONN=Host=postgres;Port=5432;Database=gjirafanews;Username=gjirafanews;Password=change-me
API_REDIS_CONN=redis:6379
API_KAFKA_BROKERS=kafka:9092
API_S3_SERVICE_URL=http://minio:9000
API_S3_BUCKET=gjirafanews
API_S3_ACCESS_KEY=minio
API_S3_SECRET_KEY=change-me-min-8-chars
API_SMTP_HOST=papercut
API_SMTP_PORT=25
API_CORS_ORIGINS=http://localhost:3000,http://localhost:3002

# ── Web env ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:5283
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
```

**📁 `infra/compose.yml`** — single file, profiles. Skeleton (full version
copies services verbatim from the two old composes, swapping inline secrets
for `${VAR}` and adding profiles):

```yaml
name: gjirafanews

services:
  postgres:
    profiles: [infra, api, web]
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      retries: 5

  pgbouncer:
    profiles: [infra, api, web]
    image: edoburu/pgbouncer:latest
    environment:
      DB_HOST: postgres
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      POOL_MODE: transaction
      AUTH_TYPE: scram-sha-256
    ports: ["6432:6432"]
    depends_on:
      postgres: { condition: service_healthy }

  redis:
    profiles: [infra, api, web]
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  keycloak-db:
    profiles: [infra, web]
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: ${KC_DB_USER}
      POSTGRES_PASSWORD: ${KC_DB_PASSWORD}
    volumes: [keycloak_db_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${KC_DB_USER} -d keycloak"]

  keycloak:
    profiles: [infra, web]
    image: quay.io/keycloak/keycloak:26.0
    command: ["start-dev", "--import-realm"]
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: ${KC_DB_USER}
      KC_DB_PASSWORD: ${KC_DB_PASSWORD}
      KC_HOSTNAME: localhost
      KC_HOSTNAME_STRICT: "false"
      KC_HTTP_ENABLED: "true"
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    ports: ["8081:8080"]                       # ← host 8081, no clash with api
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json:ro
    depends_on:
      keycloak-db: { condition: service_healthy }

  minio:
    profiles: [infra, api, web]
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]

  minio-init:
    profiles: [infra, api, web]
    image: minio/mc
    depends_on:
      minio: { condition: service_healthy }
    entrypoint:
      - sh
      - -c
      - |
        until mc alias set local http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}; do sleep 1; done
        mc mb -p local/${S3_BUCKET}
        mc anonymous set download local/${S3_BUCKET}

  kafka:
    profiles: [infra, api, web]
    image: confluentinc/cp-kafka:7.7.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,EXTERNAL://localhost:9094
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: 4L6g3nShT-eMCtK--X86sw
    ports: ["9092:9092", "9094:9094"]
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "localhost:9092", "--list"]

  papercut:
    profiles: [infra, api, web]
    image: jijiechen/papercut:latest
    ports: ["2525:25", "37408:80"]

  loki:
    profiles: [observability]
    image: grafana/loki:3.0.0
    ports: ["3100:3100"]

  grafana:
    profiles: [observability]
    image: grafana/grafana:11.0.0
    ports: ["3300:3000"]                       # ← was wrongly 3300:3300
    environment:
      GF_AUTH_ANONYMOUS_ENABLED: "true"
      GF_AUTH_ANONYMOUS_ORG_ROLE: Admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro

  kafka-ui:
    profiles: [observability]
    image: provectuslabs/kafka-ui:latest
    ports: ["8090:8080"]
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

  api:
    profiles: [api, web]
    build:
      context: ../apps/GjirafaNews              # phase-2 path; phase-3 retargets to ../apps/api
      dockerfile: GjirafaNewsAPI/Dockerfile
    ports: ["5283:8080"]
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: ${API_PG_CONN}
      ConnectionStrings__Hangfire: ${API_PG_HANGFIRE_CONN}
      ConnectionStrings__Redis: ${API_REDIS_CONN}
      Cors__AllowedOrigins: ${API_CORS_ORIGINS}
      Loki__Url: http://loki:3100
      S3__ServiceUrl: ${API_S3_SERVICE_URL}
      S3__Bucket: ${API_S3_BUCKET}
      S3__ForcePathStyle: "true"
      S3__Region: us-east-1
      AWS_ACCESS_KEY_ID: ${API_S3_ACCESS_KEY}
      AWS_SECRET_ACCESS_KEY: ${API_S3_SECRET_KEY}
      Email__Host: ${API_SMTP_HOST}
      Email__Port: ${API_SMTP_PORT}
      Kafka__BootstrapServers: ${API_KAFKA_BROKERS}
      Keycloak__Authority: http://keycloak:8080/realms/gjirafanews
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
      kafka:    { condition: service_healthy }
      minio-init: { condition: service_completed_successfully }

  web:
    profiles: [web]
    build:
      context: ../apps/gjirafa-news
      dockerfile: Dockerfile
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
      NEXT_PUBLIC_KEYCLOAK_URL: ${NEXT_PUBLIC_KEYCLOAK_URL}
    depends_on:
      api: { condition: service_started }

  admin:
    profiles: [web]
    build:
      context: ../apps/admin-web
      dockerfile: Dockerfile
    ports: ["3002:80"]
    depends_on:
      api: { condition: service_started }

volumes:
  postgres_data:
  keycloak_db_data:
  minio_data:
```

> **Note on `kafka-consumer`**: deferred to phase 6 (decision: in-API hosted
> service vs standalone). Don't include in this phase.

**📦 Move infra files:**

```bash
git mv apps/GjirafaNews/init.sql      infra/postgres/init.sql
git mv apps/GjirafaNews/grafana       infra/grafana
```

**🗑️ Old compose files:**

```bash
git rm docker-compose.keycloak.yml
git rm apps/GjirafaNews/docker-compose.yml
git rm apps/GjirafaNews/docker-compose.override.yml
git rm apps/GjirafaNews/docker-compose.dcproj
```

**✏️ `apps/GjirafaNews/GjirafaNewsAPI/GjirafaNewsAPI.csproj`** — remove the
dangling line:

```xml
<DockerComposeProjectPath>..\docker-compose.dcproj</DockerComposeProjectPath>
```

**✏️ `apps/GjirafaNews/GjirafaNewsAPI/Program.cs`** — switch CORS to a
comma-separated list:

```csharp
// Before
var adminWebOrigin = builder.Configuration["Cors:AdminWebOrigin"] ?? "http://localhost:3002";
options.AddPolicy(AdminWebCorsPolicy, p => p.WithOrigins(adminWebOrigin) ... );

// After
var origins = (builder.Configuration["Cors:AllowedOrigins"]
    ?? "http://localhost:3000,http://localhost:3002")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
options.AddPolicy(CorsPolicy, p => p
    .WithOrigins(origins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials());                                  // SignalR needs credentials
```

Update `appsettings.json` — drop `Cors:AdminWebOrigin`, add
`Cors:AllowedOrigins`.

**📁 `apps/gjirafa-news/Dockerfile`** — multi-stage Next.js standalone build.
Verify `next.config.ts` has `output: "standalone"`; add if missing.

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/gjirafa-news/package.json apps/gjirafa-news/
COPY packages packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/gjirafa-news apps/gjirafa-news
RUN pnpm --filter @gjirafanews/gjirafa-news build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/gjirafa-news/.next/standalone ./
COPY --from=build /app/apps/gjirafa-news/.next/static ./apps/gjirafa-news/.next/static
COPY --from=build /app/apps/gjirafa-news/public ./apps/gjirafa-news/public
EXPOSE 3000
CMD ["node", "apps/gjirafa-news/server.js"]
```

**📁 `apps/admin-web/Dockerfile`** — Vite build → nginx:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin-web/package.json apps/admin-web/
COPY packages packages
RUN pnpm install --frozen-lockfile
COPY apps/admin-web apps/admin-web
RUN pnpm --filter @gjirafanews/admin-web build

FROM nginx:alpine
COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**📁 `apps/admin-web/nginx.conf`** — SPA fallback:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
```

### Validate

```bash
cp infra/.env.example infra/.env
docker compose -f infra/compose.yml --profile infra up -d
docker compose -f infra/compose.yml ps                          # all healthy
curl http://localhost:8081/realms/gjirafanews                   # Keycloak responds
curl http://localhost:9001                                       # MinIO console
docker compose -f infra/compose.yml --profile api up -d
curl http://localhost:5283/swagger                               # API responds
docker compose -f infra/compose.yml --profile web up -d
curl http://localhost:3000                                       # Next.js responds
curl http://localhost:3002                                       # admin responds
```

End-to-end smoke: open admin in a browser, log into Keycloak, list articles.

### Rollback

Revert the commit; re-apply the three old compose files. Devs may have local
volumes (`postgres_data`, `keycloak-db-data`) under different compose project
names — document in `docs/runbook.md` how to migrate or wipe.

### Risk

Medium-high. Touches every dev's local workflow. One person should run a fresh
clone end-to-end before merging.

---

## Phase 3 — Rename apps (~3 hours, mechanical)

### Goal

Folder names match each other (kebab-case). No nested
`apps/GjirafaNews/GjirafaNewsAPI/`.

### Renames

```bash
git mv apps/GjirafaNews/GjirafaNewsAPI apps/api
git mv apps/GjirafaNews.Tests          apps/api-tests
git mv apps/admin-web                  apps/admin
git mv apps/gjirafa-news               apps/web
# If §1.6 keeps the standalone consumer:
# git mv apps/GjirafaNews/KafkaConsumer apps/kafka-consumer
# Otherwise (recommended):
git rm -r apps/GjirafaNews/KafkaConsumer
rmdir apps/GjirafaNews                 # now empty
```

### Files that reference these paths

| File                                                  | Edit                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/api-tests/GjirafaNews.Tests.csproj`             | `<ProjectReference Include="..\GjirafaNews\GjirafaNewsAPI\…" />` → `..\api\GjirafaNewsAPI.csproj` |
| `apps/api/Dockerfile`                                 | `COPY` paths assume parent layout — update                           |
| `infra/compose.yml`                                   | `build.context`: `../apps/api`, `../apps/web`, `../apps/admin`       |
| Root `package.json` scripts                           | `--filter @gjirafanews/gjirafa-news` → `--filter @gjirafanews/web`; same for admin |
| `apps/web/package.json`                               | `"name"`: `@gjirafanews/gjirafa-news` → `@gjirafanews/web`           |
| `apps/admin/package.json`                             | `"name"`: `@gjirafanews/admin-web` → `@gjirafanews/admin`            |
| `apps/web/Dockerfile`, `apps/admin/Dockerfile`        | `COPY apps/gjirafa-news` → `apps/web`; same for admin                |
| `apps/api/Properties/launchSettings.json`             | profile names containing "GjirafaNews" — cosmetic, optional          |

### Search-and-replace checklist

```bash
# After moves, run these and resolve hits:
rg -l 'gjirafa-news'          apps packages infra docs
rg -l 'admin-web'             apps packages infra docs
rg -l 'apps/GjirafaNews/'     apps packages infra docs
rg -l '@gjirafanews/gjirafa-news' apps packages infra docs
rg -l '@gjirafanews/admin-web'    apps packages infra docs
```

> **Do not** rename the C# namespace `GjirafaNewsAPI` or the csproj filename.
> That's idiomatic .NET and changing it churns every `using` statement,
> assembly references, and Keycloak audience.

### Validate

```bash
pnpm install
pnpm -r run build
dotnet build apps/api/GjirafaNewsAPI.csproj
dotnet test  apps/api-tests/GjirafaNews.Tests.csproj
docker compose -f infra/compose.yml --profile web up --build
```

### Risk

Low-mechanical. Big diff but the only failure mode is a missed path; the
validate step catches every one.

---

## Phase 4 — Fix `timeAgo` + package test pattern (~1 hour)

### Goal

Fix the spacing bug, set up the testing pattern in `packages/utils` so future
shared code arrives with tests.

### Changes

**✏️ `packages/utils/src/index.ts`** — replace `timeAgo` with
`Intl.RelativeTimeFormat`:

```ts
const RTF = new Intl.RelativeTimeFormat("sq-AL", { numeric: "auto" });

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year",   60 * 60 * 24 * 365],
  ["month",  60 * 60 * 24 * 30],
  ["week",   60 * 60 * 24 * 7],
  ["day",    60 * 60 * 24],
  ["hour",   60 * 60],
  ["minute", 60],
  ["second", 1],
];

export function timeAgo(date: Date | string | number, now: Date = new Date()): string {
  const target = date instanceof Date ? date : new Date(date);
  const diffSec = Math.round((target.getTime() - now.getTime()) / 1000);
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSec) >= seconds || unit === "second") {
      return RTF.format(Math.round(diffSec / seconds), unit);
    }
  }
  return RTF.format(0, "second");
}
```

**📁 `packages/utils/src/__tests__/timeAgo.test.ts`:**

```ts
import { timeAgo } from "..";

const now = new Date("2026-05-05T12:00:00Z");

describe("timeAgo", () => {
  it("formats minutes ago with proper spacing (regression: '5minutes ago')", () => {
    const out = timeAgo(new Date("2026-05-05T11:55:00Z"), now);
    expect(out).toMatch(/\s/);
    expect(out).toContain("5");
  });
  it("formats hours ago", () => {
    expect(timeAgo(new Date("2026-05-05T09:00:00Z"), now)).toMatch(/3/);
  });
  it("formats days ago", () => {
    expect(timeAgo(new Date("2026-05-03T12:00:00Z"), now)).toMatch(/2/);
  });
});
```

**📁 `packages/utils/jest.config.ts`** + add jest/ts-jest devDeps + `test`
script (see prior plan for shape).

### Validate

```bash
pnpm --filter @gjirafanews/utils test     # green
pnpm -r run test                          # picks up new package's tests
```

### Risk

None.

---

## Phase 5 — Build pipeline + Turborepo (~half day)

### Goal

Stop exporting raw `.ts`. Add Turborepo for caching + task graph.

### Per-package build

For each of `packages/types`, `packages/ui`, `packages/utils`:

**✏️ `package.json`** — set `type: module`, `main`, `module`, `types`,
`exports`, `files: ["dist"]`, build/dev scripts using `tsup`.

**📁 `packages/<pkg>/tsup.config.ts`:**

```ts
import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],     // or index.tsx for ui
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],   // ui only
});
```

**📁 Root `turbo.json`:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "dev":   { "cache": false, "persistent": true },
    "test":  { "dependsOn": ["^build"] },
    "lint":  {}
  }
}
```

**✏️ Root `package.json`** — scripts go through `turbo run`; add `turbo` as a
dev dep.

**Consumer-side** — apps no longer need `transpilePackages` for the three
packages once they ship `dist`:

- `apps/web/next.config.ts` — remove the three from `transpilePackages`.
- `apps/web/jest.config.ts` — remove the three from `moduleNameMapper`.

### Validate

```bash
pnpm install
pnpm build                                     # turbo orders correctly, caches
ls packages/*/dist                             # all three have dist/index.js + index.d.ts
pnpm --filter @gjirafanews/web build
pnpm --filter @gjirafanews/admin build
pnpm test
```

### Risk

Medium. The `exports` map can subtly break Jest or Next.js. Fallback: keep
the package in `transpilePackages` per app temporarily.

---

## Phase 6 — `Program.cs` decomposition + Hangfire dashboard auth (~half day)

### Goal

Split the 330-line `Program.cs` into composable extension methods. Lock the
Hangfire dashboard behind admin Keycloak role. Decide on the Kafka consumer
duplication.

### Changes

**📁 `apps/api/Infrastructure/Extensions/`** — one file per concern:

```
Infrastructure/Extensions/
├── ServiceCollectionExtensions.cs        (entry: AddGjirafaNewsServices)
├── DataServiceCollectionExtensions.cs    (EF, Dapper, Redis, interceptors)
├── AuthServiceCollectionExtensions.cs    (Keycloak JWT, role flattening, CORS)
├── StorageServiceCollectionExtensions.cs (S3 + AWS SDK)
├── EmailServiceCollectionExtensions.cs   (MailKit)
├── MessagingServiceCollectionExtensions.cs (Kafka producer + consumer worker + MessageLog)
├── JobsServiceCollectionExtensions.cs    (Hangfire — server, schedule registration)
├── RealtimeServiceCollectionExtensions.cs (SignalR + hub map helpers)
└── ObservabilityServiceCollectionExtensions.cs (Serilog + Loki)
```

**✏️ `apps/api/Program.cs`** — slim composition root:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.AddObservability();                            // Serilog → Loki
builder.Services
    .AddData(builder.Configuration)
    .AddAuth(builder.Configuration)
    .AddStorage(builder.Configuration)
    .AddEmail(builder.Configuration)
    .AddMessaging(builder.Configuration)
    .AddJobs(builder.Configuration)
    .AddRealtime()
    .AddControllers(o => o.Filters.Add<FluentValidationFilter>());
builder.Services.AddOpenApi();

var app = builder.Build();

await app.MigrateAndSeedAsync();                       // extracted helper
app.UseStandardMiddleware();                           // exception, logging, dev swagger, https in prod
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire", new DashboardOptions {
    Authorization = new[] { new AdminOnlyDashboardFilter() },
});
app.MapControllers();
app.MapHubs();                                         // helper that maps /hubs/{chat,notifications,dashboard}

await app.RunAsync();
```

**📁 `apps/api/Infrastructure/Hangfire/AdminOnlyDashboardFilter.cs`:**

```csharp
public sealed class AdminOnlyDashboardFilter : IDashboardAsyncAuthorizationFilter
{
    public Task<bool> AuthorizeAsync(DashboardContext context)
    {
        var http = context.GetHttpContext();
        return Task.FromResult(http.User.Identity?.IsAuthenticated == true
            && http.User.IsInRole("admin"));
    }
}
```

Hangfire dashboard auth requires the request to carry the JWT. Since the
dashboard is browser-loaded, expose it behind a small login proxy or accept
the cookie session set by Keycloak's BFF flow. Document this in
`docs/jobs.md`.

**Decision: Kafka consumer**

- **Recommended:** keep the in-API hosted `KafkaConsumerWorker` only.
- 🗑️ Delete `apps/GjirafaNews/KafkaConsumer/` (already done in phase 3).
- ✏️ Remove the `kafka-consumer` service from `infra/compose.yml`.

If you instead want to keep the standalone (e.g., for scale-out): rename to
`apps/kafka-consumer/` in phase 3, update Dockerfile and compose context.

### Validate

```bash
dotnet build apps/api/GjirafaNewsAPI.csproj
dotnet test  apps/api-tests/GjirafaNews.Tests.csproj
docker compose -f infra/compose.yml --profile api up --build
curl http://localhost:5283/hangfire                   # 401 / redirect (good)
# Authenticate as a user with the admin Keycloak role; dashboard renders.
```

### Risk

Medium. `Program.cs` decomposition is mechanical but every misplaced service
registration becomes a runtime DI failure. The validate steps catch most.

---

## Phase 7 — Auth consolidation (largest, ~1–2 days)

### Goal

Single auth system: Keycloak everywhere. Public site stops hand-rolling JWT.

### Decision

- `web` — Auth.js v5 with Keycloak provider (idiomatic for App Router +
  middleware).
- `admin` — keep `keycloak-js` (already wired).
- Shared types/role helpers in `packages/auth`.

### Changes

**📁 `packages/auth/`:**

```
packages/auth/
├── package.json                    "@gjirafanews/auth"
├── tsup.config.ts
└── src/
    ├── index.ts
    ├── config.ts                   typed Keycloak config + env loader
    ├── tokens.ts                   decode, role parse, isExpired
    └── react/
        ├── KeycloakProvider.tsx    used by admin
        └── useAuth.ts
```

The package owns: typed `KeycloakConfig`, env helper, pure token utilities,
React provider for SPA usage. Auth.js setup for `web` lives in
`apps/web/lib/auth.ts` and uses `@gjirafanews/auth` for typed config + role
helpers only.

**✏️ `apps/admin/`** — migrate to `@gjirafanews/auth`:

| Path                                | Action                                                     |
| ----------------------------------- | ---------------------------------------------------------- |
| `src/lib/keycloak.ts`               | 🗑️ delete (logic moves to package)                          |
| `src/lib/auth-context.tsx`          | ✏️ wrap `@gjirafanews/auth`'s `KeycloakProvider`             |
| `src/lib/api.ts`                    | ✏️ pull token from `useAuth()` not local Keycloak instance   |

**✏️ `apps/web/`** — replace hand-rolled auth:

| Path                                  | Action                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| `app/api/auth/login/route.ts`         | 🗑️                                                          |
| `app/api/auth/logout/route.ts`        | 🗑️                                                          |
| `app/api/auth/register/route.ts`      | 🗑️                                                          |
| `app/api/auth/me/route.ts`            | 🗑️                                                          |
| `lib/session.ts`                      | 🗑️                                                          |
| `lib/session-edge.ts`                 | 🗑️                                                          |
| `lib/auth-guard.ts`                   | 🗑️ (the dead `KEYCLOAK_ISSUER` reference)                   |
| `lib/auth.ts`                         | 📁 new — Auth.js v5 with Keycloak provider                  |
| `app/api/auth/[...nextauth]/route.ts` | 📁 new — Auth.js handler                                    |
| `proxy.ts` (middleware)               | ✏️ swap cookie check for Auth.js `auth()` helper             |
| `package.json`                        | ✏️ remove `bcryptjs`, `@types/bcryptjs`, `jose`; add `next-auth@beta` |
| `lib/data.ts`                         | ✏️ delete the in-memory user array                           |
| `__tests__/api/login.*`               | 🗑️ delete the integration tests for the removed routes      |
| Components calling `/api/auth/*`      | ✏️ swap for Auth.js `signIn`/`signOut` + `useSession`        |
| `lib/notifications-context.tsx`, `lib/dashboard-hub.ts` | ✏️ pull token from `useSession()` for SignalR `accessTokenFactory` |

**✏️ `infra/keycloak/realm-export.json`** — confirm clients exist:

- `web` — public client, redirect URIs include
  `http://localhost:3000/api/auth/callback/keycloak`.
- `admin-web` — public client, PKCE, already configured.

If `web` doesn't exist, add via Keycloak admin UI (`http://localhost:8081`) and
re-export. Document the procedure in `docs/auth.md`.

**✏️ `apps/api/Program.cs`** — already validates Keycloak JWT, no change.
Verify the realm export's audience matches what both apps request. SignalR
hubs should accept the JWT as `access_token` query param (default behavior
when `[Authorize]` is set on the hub).

### Validate

```bash
docker compose -f infra/compose.yml --profile web up -d
# Manual:
# 1. http://localhost:3000 → click Login → redirected to Keycloak (port 8081) → back to / with session
# 2. http://localhost:3002 → /login → Keycloak → admin dashboard loads
# 3. Both apps hit the .NET API with valid Bearer tokens (Network tab)
# 4. Web SignalR connections to /hubs/notifications and /hubs/dashboard reconnect with the JWT
pnpm test                    # all remaining unit tests pass
pnpm test:e2e                # contact-wizard.spec passes; admin-article-flow rewritten to use Keycloak login
```

### Risk

High. Largest behavioral change. Split into two PRs:

- **7a:** introduce `packages/auth`, migrate `admin` (low risk, behavior
  unchanged).
- **7b:** rip out hand-rolled auth in `web`, switch to Auth.js (the risky bit).

### Rollback

Revert PR 7b independently if needed; 7a stands on its own.

---

## Phase 8 — API client + delete mock routes (~1 day)

### Goal

`web` stops being a fake API for itself. `admin` stops talking to two
backends. The .NET API owns articles/categories/sources/notifications/etc. for
both apps.

### Changes

**📁 `packages/api-client/`:**

```
packages/api-client/
├── package.json
├── tsup.config.ts
└── src/
    ├── index.ts
    ├── client.ts          typed fetch wrapper, baseUrl + tokenProvider
    ├── articles.ts
    ├── categories.ts
    ├── sources.ts
    ├── notifications.ts   GET /api/notifications, POST /api/notifications (admin)
    ├── chat.ts            GET /api/live-chat (recent)
    ├── uploads.ts         multipart init/complete/abort (calls /api/uploads)
    ├── emails.ts          POST send + schedule
    └── errors.ts          ApiError, parses .NET ApiResponse envelope
```

Public usage:

```ts
import { createApiClient } from "@gjirafanews/api-client";

const api = createApiClient({
  baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  getToken: () => session?.accessToken,
});

await api.articles.list({ page: 1, pageSize: 20 });
await api.uploads.initMultipart({ filename, contentType, size });
```

**✏️ `apps/web/`** — delete mock routes, rewrite consumers:

| Path                            | Action                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| `app/api/articles/route.ts`     | 🗑️                                                                |
| `app/api/articles/[id]/route.ts`| 🗑️                                                                |
| `app/api/categories/**`         | 🗑️                                                                |
| `app/api/sources/route.ts`      | 🗑️                                                                |
| `app/api/chat/route.ts`         | 🗑️ (old mock; the new chat is via SignalR + REST seed at .NET)    |
| `app/api/newsletter/route.ts`   | Keep (Resend integration is correctly owned by web)               |
| `lib/data.ts`                   | ✏️ delete in-memory articles/categories/sources arrays            |
| `lib/store/`                    | ✏️ replace RTK Query endpoints with `@gjirafanews/api-client`      |
| `lib/uploads.ts`                | ✏️ thin wrapper over `api.uploads.*`                              |
| Server components               | ✏️ `import { api } from "@/lib/api"` and use directly with `cache: 'force-cache'` + `next: { revalidate }` |

**✏️ `apps/admin/`** — single base URL:

| Path                | Action                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `src/lib/api.ts`    | ✏️ replace bespoke fetch with `@gjirafanews/api-client`. Drop `apiContent()` and `CONTENT_API_URL`. |
| `.env.example`      | ✏️ remove `VITE_CONTENT_API_URL`                                     |

**✏️ `infra/.env.example`** — remove the now-unused web-side proxy env, if any.

**✏️ `apps/web/proxy.ts` (middleware)** — inventory what's left after the
mock routes are gone (auth callbacks, newsletter); remove dead rewrites.

### Validate

```bash
pnpm build
docker compose -f infra/compose.yml --profile web up -d
curl http://localhost:5283/api/articles           # .NET serves
curl -I http://localhost:3000/api/articles        # 404 (intentional)
# Manual: open web homepage, articles render. Open admin, articles list renders.
pnpm test                                          # update mocks targeting deleted /api/* routes
pnpm test:e2e
```

### Risk

Medium-high. Touches every product surface that reads articles. Lean on the
Playwright suite for safety; expect visual regressions to surface in dev.

---

## Phase 9 — Realtime consolidation (~1 day)

### Goal

Centralize SignalR HubConnection wiring in `packages/realtime`. Admin starts
consuming hubs.

### Changes

**📁 `packages/realtime/`:**

```
packages/realtime/
├── package.json                           "@gjirafanews/realtime"
├── tsup.config.ts
└── src/
    ├── index.ts
    ├── connection.ts                      createHubConnection(hubName, getToken)
    ├── hubs/
    │   ├── notifications.ts               typed events: presence, notification
    │   ├── dashboard.ts                   typed events: snapshot
    │   └── chat.ts                        typed events: chat, online
    └── react/
        ├── useNotificationsHub.ts
        ├── useDashboardHub.ts
        └── useChatHub.ts
```

Connection factory:

```ts
export function createHubConnection(hubName: string, opts: { baseUrl: string; getToken: () => string | null }) {
  return new HubConnectionBuilder()
    .withUrl(`${opts.baseUrl}/hubs/${hubName}`, {
      accessTokenFactory: () => Promise.resolve(opts.getToken() ?? ""),
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}
```

**✏️ `apps/web/`** — replace ad-hoc setups:

| Path                                  | Action                                          |
| ------------------------------------- | ----------------------------------------------- |
| `lib/dashboard-hub.ts`                | ✏️ delegate to `packages/realtime`              |
| `lib/notifications-context.tsx`       | ✏️ delegate to `useNotificationsHub`             |
| `components/chat/*`                    | ✏️ delegate to `useChatHub`                      |
| `package.json`                        | `@microsoft/signalr` becomes a dep of `packages/realtime` instead — dedupe |

**✏️ `apps/admin/`** — start consuming hubs:

| Path                               | Action                                          |
| ---------------------------------- | ----------------------------------------------- |
| `src/pages/dashboard.tsx`          | 📁 add a real-time tile via `useDashboardHub`   |
| `src/components/notification-bell.tsx` | 📁 new — uses `useNotificationsHub`         |
| `package.json`                     | add `@gjirafanews/realtime`                      |

### Validate

```bash
pnpm test
docker compose -f infra/compose.yml --profile web up -d
# Manual: open web, send a notification from admin (POST /api/notifications), confirm it lands on web in realtime.
# Open admin dashboard, confirm real-time snapshot updates every 30s (per DashboardBackgroundService).
```

### Risk

Medium. Realtime bugs are hard to spot in tests but easy to spot in manual
QA. Scope sub-PRs to one hub at a time if it gets hairy.

---

## Phase 10 — CI (~half day)

### Goal

Every PR runs lint, test, build, dotnet test, and a smoke E2E.

### Changes

**📁 `.github/workflows/ci.yml`:**

```yaml
name: ci

on:
  push: { branches: [main] }
  pull_request:

jobs:
  js:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_USER: gjirafanews, POSTGRES_PASSWORD: secret-ci, POSTGRES_DB: gjirafanews_test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U gjirafanews"
          --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build lint test
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM:  ${{ vars.TURBO_TEAM }}

  dotnet:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_USER: gjirafanews, POSTGRES_PASSWORD: secret-ci, POSTGRES_DB: gjirafanews_test }
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U gjirafanews" --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: "10.0.x" }
      - run: dotnet build apps/api/GjirafaNewsAPI.csproj
      - run: dotnet test  apps/api-tests/GjirafaNews.Tests.csproj --logger "trx;LogFileName=test.trx"
        env:
          ConnectionStrings__DefaultConnection: "Host=localhost;Port=5432;Database=gjirafanews_test;Username=gjirafanews;Password=secret-ci"
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: dotnet-tests, path: "**/test.trx" }

  e2e:
    runs-on: ubuntu-latest
    needs: [js]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm --filter @gjirafanews/web test:e2e
```

**Branch protection** — require `js`, `dotnet`, `e2e` checks before merge to
`main`. Document setup in `docs/runbook.md`.

### Validate

Open a throwaway PR; confirm all three jobs run and pass.

### Risk

Low. CI failure doesn't break local dev; iterate on the workflow without
touching the codebase.

---

## Cross-cutting follow-ups

These don't fit cleanly in one phase but should land somewhere along the way:

- **`apps/web/lib/env.ts`** — zod-validated env schema (best added during
  phase 7 auth churn).
- **`apps/admin/src/lib/env.ts`** — same pattern for Vite (`import.meta.env`).
- **API IOptions binding** — typed `S3Options`, `KafkaOptions`,
  `EmailOptions`, `HangfireOptions` (probably during phase 6 decomposition).
- **`docs/runbook.md`** — write after phase 2.
- **`docs/auth.md`** — write during phase 7 (Keycloak realm setup, client
  configuration, role conventions).
- **`docs/realtime.md`** — write during phase 9 (hubs + events + reconnection
  policy).
- **`docs/storage.md`** — write during phase 2 (MinIO setup, bucket policy,
  multipart flow).
- **`docs/jobs.md`** — write during phase 6 (Hangfire dashboard auth, job
  catalog, recurring schedule).
- **`docs/messaging.md`** — write during phase 6 (Kafka topics, consumer
  groups, retention policy).
- **`apps/web/components/`** adoption of `@gjirafanews/ui` primitives —
  open follow-up after phase 5 lands the build pipeline.
- **`packages/utils`** — fold `slugify()` from `apps/web/lib/data.ts` after
  phase 8 deletes the rest of `data.ts`.

---

## Phase ordering & dependencies

```
   ┌── Phase 1 (Hygiene + delete deprecated apps) ──┐
   │                                                │
   ├── Phase 2 (infra/) ────────────────────────────┤
   │                                                │
   ├── Phase 4 (timeAgo + tests) ───────────────────┤
   │                                                │
   └── Phase 3 (rename apps) ────┬───────────────────┘
                                  │
            ┌────────────┬────────┼────────┬─────────┐
            │            │        │        │         │
        Phase 5      Phase 6   Phase 7  Phase 8  Phase 9
        (build)    (Program.cs (auth)  (api      (realtime)
                   + Hangfire)         consol.)
            │            │        │        │         │
            └────────────┴────────┴────────┴─────────┘
                                  │
                            Phase 10 (CI)
```

Phases 1, 2, 4 are independent. Phase 3 (renames) is invasive enough that
phase 5/6/7/8/9 each touch many app paths, so renaming first prevents
churn-heavy diffs landing in the same files. Phase 10 (CI) lands last because
it's the green light that everything else is healthy.
