# GjirafaNews Monorepo

A news platform built as a pnpm monorepo with 4 applications and 3 shared packages.

## Architecture Overview

```
gjirafanews-monorepo/
├── apps/
│   ├── gjirafa-news/  Next.js 16  — public news site          → localhost:3000
│   ├── pulse-news/    Next.js 16  — public news site (v2)     → localhost:3001
│   ├── admin-web/     Vite + React Router — admin dashboard   → localhost:3002
│   └── admin-web2/    Vite + React Router — admin dashboard   → localhost:3003
├── packages/
│   ├── types/         Shared TypeScript types
│   ├── ui/            Shared React components (Button, Input, Select, Textarea, Modal, ArticlesTable)
│   └── utils/         Shared utility functions (timeAgo, getArticleWithRelations, createIdGenerator)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 10 (`npm install -g pnpm`)

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Approve build scripts (first time only)

```bash
pnpm approve-builds
```

### 3. Set up environment variables

Create `.env.local` in each Next.js app:

```bash
# apps/gjirafa-news/.env.local
SESSION_SECRET=your-secret-key-here
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# apps/pulse-news/.env.local
SESSION_SECRET=your-secret-key-here
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Run development servers

```bash
# All apps at once
pnpm dev

# Individual apps
pnpm dev:gjirafa     # gjirafa-news only (port 3000)
pnpm dev:pulse       # pulse-news only (port 3001)
pnpm dev:admin       # admin-web only (port 3002)
pnpm dev:admin2      # admin-web2 only (port 3003)
```

---

## Applications

### apps/gjirafa-news — Public News Site

| | |
|---|---|
| **Framework** | Next.js 16.2.1 (Turbopack) |
| **Port** | 3000 |
| **Entry** | `app/layout.tsx` → `app/page.tsx` |

**Routes:**

| Route | Description |
|---|---|
| `/` | Homepage — latest articles |
| `/article/[id]` | Article detail page |
| `/category/[slug]` | Articles filtered by category |
| `/topics` | All categories |
| `/saved` | User's saved articles |
| `/login` | Authentication page |
| `/admin` | Admin dashboard (auth-guarded) |
| `/admin/articles/new` | Create new article |
| `/admin/articles/[id]/edit` | Edit existing article |

**API Routes:**

| Endpoint | Methods |
|---|---|
| `/api/auth/login` | POST |
| `/api/auth/logout` | POST |
| `/api/auth/register` | POST |
| `/api/auth/me` | GET |
| `/api/articles` | GET, POST |
| `/api/articles/[id]` | GET, PUT, DELETE |
| `/api/categories` | GET |
| `/api/sources` | GET |

**State Management:**
- Redux Toolkit — authentication state
- Zustand — saved articles (persisted)
- TanStack React Query — server data fetching

**Database:** SQLite (`dev.db`) with in-memory data in `lib/data.ts` (development only).

---

### apps/pulse-news — Public News Site (v2)

Same as `apps/gjirafa-news` but runs on **port 3001**. Serves as a parallel version for development/testing.

---

### apps/admin-web — Admin Dashboard

| | |
|---|---|
| **Framework** | Vite 6.3 + React Router 7.6 |
| **Port** | 3002 |
| **Entry** | `src/main.tsx` → `src/App.tsx` |
| **API Proxy** | `/api/*` → `localhost:3000` (gjirafa-news) |

**Pages:**

| Path | File | Description |
|---|---|---|
| `/login` | `src/pages/login.tsx` | Admin login |
| `/` | `src/pages/dashboard.tsx` | Virtualized article list |
| `/articles/new` | `src/pages/new-article.tsx` | Create article form |
| `/articles/[id]/edit` | `src/pages/edit-article.tsx` | Edit article form |

**Key Components:**
- `admin-layout.tsx` — Sidebar/header layout wrapper
- `article-form.tsx` — Reusable create/edit form
- `protected-route.tsx` — Auth guard for routes
- `logout-button.tsx` — Session logout

---

### apps/admin-web2 — Admin Dashboard (v2)

Same as `apps/admin-web` but runs on **port 3003**. API proxy targets `localhost:3001` (pulse-news).

---

## Shared Packages

### packages/types

Single source of truth for all TypeScript types across the monorepo.

**Key Types:**
- `Article`, `Category`, `Source` — domain entities
- `User`, `SafeUser`, `UserRole` — authentication
- `ArticleWithRelations` — article with populated category & source
- `SessionPayload` — JWT session shape
- `LoginRequest`, `RegisterRequest`, `AuthResponse` — API contracts
- `CreateArticleRequest`, `ArticleFormData` — form data

**Usage:**
```ts
import type { ArticleWithRelations, Category } from "@gjirafanews/types";
```

---

### packages/ui

Shared React component library styled with Tailwind CSS (gn-* design tokens).

| Component | Description |
|---|---|
| `Button` | Primary / danger / ghost variants, sm / md / lg sizes |
| `Input` | Text input with optional label |
| `Select` | Dropdown with optional label |
| `Textarea` | Multi-line input with optional label |
| `Modal` | Native `<dialog>` based overlay with backdrop |
| `ArticlesTable` | Virtualized data table with dynamic columns |

Each component has JSDoc documentation with usage examples inside its source file.

**Usage:**
```tsx
import { Button, Input, Modal, ArticlesTable } from "@gjirafanews/ui";
import type { Column } from "@gjirafanews/ui";
```

**Peer Dependencies:** `react >= 19`, `react-dom >= 19`

---

### packages/utils

Shared utility functions.

| Function | Description |
|---|---|
| `getArticleWithRelations()` | Join an article with its category and source objects |
| `timeAgo(date)` | Format a date as relative time ("5m", "3h", "2d") |
| `createIdGenerator(prefix)` | Create a sequential ID generator with a prefix |

**Usage:**
```ts
import { timeAgo, getArticleWithRelations } from "@gjirafanews/utils";
```

---

## Scripts Reference

### Root Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all 4 apps in parallel |
| `pnpm dev:gjirafa` | Start gjirafa-news only (port 3000) |
| `pnpm dev:pulse` | Start pulse-news only (port 3001) |
| `pnpm dev:admin` | Start admin-web only (port 3002) |
| `pnpm dev:admin2` | Start admin-web2 only (port 3003) |
| `pnpm build` | Build gjirafa-news for production |
| `pnpm start` | Start gjirafa-news production server |
| `pnpm lint` | Run ESLint on gjirafa-news |
| `pnpm test` | Run Jest unit tests (gjirafa-news) |
| `pnpm test:e2e` | Run Playwright E2E tests (gjirafa-news) |
| `pnpm format` | Format all files with Prettier |

### App-Level Scripts

```bash
# Next.js apps (gjirafa-news, pulse-news)
pnpm --filter @gjirafanews/gjirafa-news dev
pnpm --filter @gjirafanews/gjirafa-news build
pnpm --filter @gjirafanews/gjirafa-news test
pnpm --filter @gjirafanews/gjirafa-news test:e2e

pnpm --filter @gjirafanews/pulse-news dev
pnpm --filter @gjirafanews/pulse-news build

# Vite apps (admin-web, admin-web2)
pnpm --filter @gjirafanews/admin-web dev
pnpm --filter @gjirafanews/admin-web build
pnpm --filter @gjirafanews/admin-web preview
```

---

## Testing

### Unit Tests (Jest)

Available in `apps/gjirafa-news` and `apps/pulse-news`.

```bash
pnpm test              # run all tests
pnpm test -- --watch   # watch mode
```

- **Config:** `jest.config.ts` (ts-jest, jsdom environment)
- **Setup:** `jest.setup.ts` (auto-imports @testing-library/jest-dom)
- **Tests:** `__tests__/` directory
- **Mocks:** `__mocks__/` (fileMock.js, styleMock.js, server-only.js)

### E2E Tests (Playwright)

Available in `apps/gjirafa-news` and `apps/pulse-news`.

```bash
pnpm test:e2e                    # headless
pnpm test:e2e -- --headed        # with browser
pnpm test:e2e -- --ui            # Playwright UI
```

- **Config:** `playwright.config.ts`
- **Browser:** Chromium only
- **Tests:** `e2e/` directory
- **Reports:** `test-results/` (screenshots, traces on failure)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Package Manager | pnpm | 10.x |
| Framework (public) | Next.js | 16.2.1 |
| Framework (admin) | Vite | 6.3.0 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | 4.x |
| Routing (admin) | React Router | 7.6.0 |
| State (auth) | Redux Toolkit | 2.11.2 |
| State (saved) | Zustand | 5.0.12 |
| Data Fetching | TanStack React Query | 5.96.0 |
| Virtualization | TanStack React Virtual | 3.13.23 |
| Auth | jose + bcryptjs | JWT sessions |
| Database | SQLite | dev.db |
| Unit Testing | Jest + Testing Library | 30.3.0 |
| E2E Testing | Playwright | 1.59.1 |
| Linting | ESLint | 9.x |
| Formatting | Prettier | 3.8.2 |

---

## Port Map

| App | Port | URL |
|---|---|---|
| gjirafa-news | 3000 | http://localhost:3000 |
| pulse-news | 3001 | http://localhost:3001 |
| admin-web | 3002 | http://localhost:3002 |
| admin-web2 | 3003 | http://localhost:3003 |

Admin apps proxy `/api/*` requests to their paired public app (admin-web → gjirafa-news, admin-web2 → pulse-news).

---

## Workspace Dependencies

Internal packages use the `workspace:*` protocol:

```
apps/gjirafa-news → @gjirafanews/types, @gjirafanews/ui, @gjirafanews/utils
apps/pulse-news   → @gjirafanews/types, @gjirafanews/ui, @gjirafanews/utils
apps/admin-web    → @gjirafanews/types, @gjirafanews/ui, @gjirafanews/utils
apps/admin-web2   → @gjirafanews/types, @gjirafanews/ui, @gjirafanews/utils
packages/ui       → @gjirafanews/types, @tanstack/react-virtual
packages/utils    → @gjirafanews/types
packages/types    → (no internal deps)
```

---

## Project Conventions

- **Design tokens:** All colors use the `gn-*` prefix (e.g., `bg-gn-primary`, `text-gn-text`)
- **Language:** UI text is in Albanian (sq-AL)
- **Imports:** Use `@/` alias for app-local imports, `@gjirafanews/*` for shared packages
- **Components:** Shared UI lives in `packages/ui`, app-specific components stay in each app's `components/` directory
- **Types:** All shared types go through `packages/types` — never duplicate type definitions across apps



 SSE side:                                                                                                                           
  - https://sse.dev/test (demo)
  - Vercel ai SDK + useChat (production pattern)                                                                                      
  - Native fetch + ReadableStream (showing how it works under the hood)                                                             
                                                                                                                                      
  WS side:                                                                                                                            
  - wss://echo.websocket.events (demo send/receive)                                                                                   
  - wss://stream.binance.com:9443/ws/btcusdt@trade (real-world feed demo)                                                             
  - Native WebSocket API (no library needed for teaching basics)    