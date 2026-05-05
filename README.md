# GjirafaNews Monorepo

A news platform built as a pnpm monorepo: a Next.js public site, a Vite admin
dashboard, a .NET 10 API with realtime/messaging/storage features, and shared
TypeScript packages.

## Architecture

```
gjirafanews-monorepo/
├── apps/
│   ├── web/      Next.js 16 — public news site             → localhost:3000
│   ├── admin/         Vite + React Router — admin dashboard     → localhost:3002
│   ├── GjirafaNews/       .NET 10 API + Kafka consumer              → localhost:5283 (dev)
│   └── GjirafaNews.Tests/ xUnit test project for the API
├── packages/
│   ├── types/             Shared TypeScript types
│   ├── ui/                Shared React components (Button, Input, Select, Textarea, Modal, ArticlesTable)
│   └── utils/             Shared utility helpers
├── infra/                 Keycloak realm export (more infra moves in by phase 2 of the architecture plan)
└── docs/
    ├── architecture-changes.md   Audit + restructuring proposal
    └── plans/                    Implementation plans, feature plans
```

The API runs more than CRUD: Postgres + EF Core + Dapper, Redis caching,
Keycloak JWT auth, SignalR hubs (`/hubs/{notifications,chat,dashboard}`), S3
multipart uploads, MailKit email, Kafka producer/consumer, and Hangfire
scheduled jobs.

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (`npm install -g pnpm`)
- Docker Desktop (for Postgres, Keycloak, Kafka, etc.)
- .NET SDK 10 (only if working on the API outside Docker)

## Getting started

```bash
# Install JS workspace deps
pnpm install
pnpm approve-builds          # first time only

# Per-app env files
cp apps/admin/.env.example apps/admin/.env.local
# (web/.env.local is set up by hand for now — see docs/runbook.md once it lands)

# Start backing services (currently two separate compose files; phase 2 of the
# architecture plan consolidates these into infra/compose.yml)
docker compose -f docker-compose.keycloak.yml up -d
docker compose -f apps/GjirafaNews/docker-compose.yml up -d

# Start frontends
pnpm dev                     # all JS apps in parallel
pnpm dev:web                 # web only (port 3000)
pnpm dev:admin               # admin only  (port 3002)
```

## Scripts

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `pnpm dev`         | Start all JS apps in parallel                             |
| `pnpm dev:web`     | Start `web` only (3000)                          |
| `pnpm dev:admin`   | Start `admin` only (3002)                             |
| `pnpm build`       | Build every workspace                                     |
| `pnpm lint`        | Lint every workspace                                      |
| `pnpm test`        | Run unit tests in every workspace                         |
| `pnpm test:e2e`    | Run Playwright E2E in `web`                      |
| `pnpm format`      | Prettier across the repo                                  |

For .NET:

```bash
dotnet build apps/GjirafaNews/GjirafaNewsAPI/GjirafaNewsAPI.csproj
dotnet test  apps/GjirafaNews.Tests/GjirafaNews.Tests.csproj
```

## Apps

### `apps/web` — Public site

Next.js 16 (App Router, Turbopack). Server components for SSR, client
components for SignalR-backed realtime (live chat, dashboard snapshots,
notifications). Resend for newsletter emails.

### `apps/admin` — Admin dashboard

Vite + React 19 + React Router. Auth via Keycloak (`keycloak-js`). React Query
for server state. Used to manage articles and (soon) trigger broadcasts /
moderate chat.

### `apps/GjirafaNews/GjirafaNewsAPI` — Backend

ASP.NET Core 10 service. See [`docs/architecture-changes.md`](docs/architecture-changes.md)
for the full feature list — short version: REST controllers, SignalR hubs,
Hangfire jobs, Kafka messaging, S3 multipart uploads, MailKit email, Redis
caching, Postgres + EF Core 10.

### `apps/GjirafaNews.Tests`

xUnit + Testcontainers + Moq. Currently sparse; growing toward
`WebApplicationFactory` integration tests.

## Shared packages

### `packages/types`
Single source of truth for cross-app TypeScript types
(`Article`, `Category`, `Source`, `User`, `SessionPayload`,
`ArticleWithRelations`, API contracts).

### `packages/ui`
React components (`Button`, `Input`, `Select`, `Textarea`, `Modal`,
`ArticlesTable`). Tailwind, `gn-*` tokens. Currently consumed by `admin`;
adoption in `web` is on the architecture roadmap.

### `packages/utils`
Helpers: `timeAgo`, `getArticleWithRelations`, `createIdGenerator`.

## Tech stack

| Layer          | Tool                              |
| -------------- | --------------------------------- |
| Package manager| pnpm 10                           |
| Public site    | Next.js 16, React 19, TypeScript  |
| Admin          | Vite 6, React Router 7            |
| API            | ASP.NET Core 10, EF Core 10       |
| Auth           | Keycloak 26                       |
| Realtime       | SignalR + `@microsoft/signalr`    |
| DB             | Postgres 16 + PgBouncer + Redis   |
| Messaging      | Kafka (KRaft mode)                |
| Background jobs| Hangfire (Postgres backend)       |
| Object storage | S3 (CDN77 in dev override; MinIO planned for local) |
| Email          | MailKit (Papercut catcher in dev) |
| Logs           | Serilog → Loki → Grafana          |
| Tests          | Jest + Playwright (JS), xUnit + Testcontainers (.NET) |

## Conventions

See [`docs/conventions.md`](docs/conventions.md) for project-wide rules
(naming, design tokens, language). Imports use `@/` for app-local paths and
`@gjirafanews/*` for shared packages.

## Roadmap

The repo is mid-restructuring. The audit lives at
[`docs/architecture-changes.md`](docs/architecture-changes.md) and the phased
implementation plan at
[`docs/plans/architecture-changes-plan.md`](docs/plans/architecture-changes-plan.md).
Both are the authoritative source for what's changing and why.

## Feedback

Open an issue for bugs / feature requests. For larger architectural changes,
update or add a doc under `docs/plans/` first.
