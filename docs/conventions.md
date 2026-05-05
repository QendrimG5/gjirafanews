# GjirafaNews — Project Rules & Conventions

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| Framework          | Next.js 16.2.1 (App Router)                 |
| Language           | TypeScript 5 (strict mode)                   |
| UI Library         | React 19.2.4                                 |
| Styling            | Tailwind CSS 4 + CSS Custom Properties       |
| Client State       | Redux Toolkit 2.x (auth), Zustand 5.x (saved articles) |
| Server State       | TanStack React Query 5.x                    |
| Auth               | JWT via `jose` + password hashing via `bcryptjs` |
| Database           | In-memory arrays (no ORM, no DB)             |
| Testing            | Jest 30 + Testing Library (unit), Playwright 1.x (E2E) |
| Linting            | ESLint 9 flat config (core-web-vitals + typescript) |
| Analytics          | Google Analytics 4 (gtag data layer)         |
| Virtualization     | @tanstack/react-virtual (admin tables)       |
| Fonts              | Geist Sans & Geist Mono (Google Fonts)       |

---

## File Structure (Monorepo)

```
apps/web/                    # Next.js application (all app code lives here)
packages/ui/                 # Shared component library (Button, Input, Modal)
packages/utils/              # Pure utility functions
packages/types/              # Shared TypeScript types
```

### apps/web/ (Next.js)

```
app/
  layout.tsx                 # Root layout (providers, fonts, navbar, bottom-nav)
  page.tsx                   # Homepage (server component)
  globals.css                # Tailwind imports + CSS custom properties
  robots.ts                  # SEO robots config
  sitemap.ts                 # Dynamic sitemap generation
  icon.tsx / apple-icon.tsx  # Favicon generation

  api/
    auth/
      login/route.ts         # POST — authenticate user
      logout/route.ts        # POST — destroy session
      register/route.ts      # POST — create user
      me/route.ts            # GET  — current session
    articles/
      route.ts               # GET (list, filter) / POST (create)
      [id]/route.ts          # GET / PUT / DELETE single article
    categories/route.ts      # GET all categories
    sources/route.ts         # GET all sources

  article/[id]/page.tsx      # Article detail (server component)
  category/[slug]/page.tsx   # Category listing (server component)
  topics/page.tsx            # All topics (server component)
  login/page.tsx             # Login form (client component)
  saved/page.tsx             # Saved articles (client component, Zustand)

  admin/
    layout.tsx               # Server-side auth guard (redirect if not admin)
    page.tsx                  # Article management dashboard (client, virtualized)
    articles/
      new/page.tsx           # Create article form
      [id]/edit/page.tsx     # Edit article form

components/
  navbar.tsx                 # Sticky top navigation
  bottom-nav.tsx             # Mobile bottom navigation
  news-card.tsx              # Article card (presentational)
  article-form.tsx           # Reusable create/edit form
  save-button.tsx            # Toggle save (Zustand)
  saved-count.tsx            # Badge showing saved count
  auth-nav-link.tsx          # Conditional login/admin link
  theme-toggle.tsx           # Dark/light mode switcher
  theme-provider.tsx         # Theme context (useSyncExternalStore)
  providers.tsx              # Redux + QueryClient wrapper
  category-bar.tsx           # Horizontal category filter
  google-analytics.tsx       # GA4 script loader
  track-event.tsx            # Event tracking helper
  admin-logout-button.tsx    # Admin logout action

lib/
  data.ts                    # In-memory data (articles, users, categories, sources)
  session.ts                 # JWT encrypt/decrypt, cookie management
  session-edge.ts            # Edge-compatible session utilities
  auth-guard.ts              # requireAdmin() server middleware
  store/
    store.ts                 # Redux store configuration
    authSlice.ts             # Auth state (user, isAuthenticated)
    hooks.ts                 # Typed useAppDispatch, useAppSelector
    api.ts                   # TanStack Query hooks & fetch wrapper
    saved-articles.ts        # Zustand store (saved article IDs, localStorage)

__tests__/                   # Jest unit/integration tests
e2e/                         # Playwright E2E tests
public/                      # Static assets (images)
```

### Monorepo Rules

- **`apps/web/`** — the Next.js app; all pages, API routes, and app-specific components live here.
- **`packages/ui/`** — reusable, presentational UI components shared across apps. Each component gets its own file (e.g., `Button.tsx`, `Input.tsx`, `Modal.tsx`). No app-specific logic.
- **`packages/utils/`** — pure utility functions with no React or framework dependencies. Must be fully tree-shakeable.
- **`packages/types/`** — shared TypeScript types and interfaces used across multiple packages/apps. Single source of truth for domain types (`Article`, `User`, `Category`, etc.).

---

## Naming Conventions

| Element         | Convention       | Example                          |
| --------------- | ---------------- | -------------------------------- |
| Component files | kebab-case       | `news-card.tsx`, `save-button.tsx` |
| Component names | PascalCase       | `NewsCard`, `SaveButton`         |
| Utility files   | camelCase        | `authSlice.ts`, `saved-articles.ts` |
| Functions       | camelCase        | `getArticleWithRelations()`, `handleSubmit()` |
| Custom hooks    | `use` prefix     | `useSavedArticles()`, `useTheme()` |
| Types/Interfaces| PascalCase       | `Article`, `SafeUser`, `ArticleWithRelations` |
| CSS variables   | `--gn-` prefix   | `--gn-primary`, `--gn-accent`   |
| Tailwind classes| `gn-` prefix     | `bg-gn-primary`, `text-gn-text` |
| API routes      | kebab-case       | `/api/auth/login`, `/api/articles/[id]` |
| Dynamic segments| brackets         | `[id]`, `[slug]`                 |
| Constants       | SCREAMING_SNAKE  | Rarely used (most values inlined)|

---

## Component Rules

1. **Server-first** — components are server components by default (no directive needed).
2. **Client boundary** — add `"use client"` only when the component needs hooks, event handlers, or browser APIs.
3. **Props over context** — pass data through props; context is reserved for cross-cutting concerns (theme only).
4. **Presentational components** receive data as props and render UI (`NewsCard`, `CategoryBar`).
5. **Container/page components** fetch data and manage state (`AdminPage`, `LoginPage`).
6. **Reusable forms** — `ArticleForm` is shared between create and edit pages via props (`initialData`, `onSubmit`, `isSubmitting`, `submitLabel`).

---

## Hooks Usage

### Built-in React Hooks
- `useState` — local form/UI state
- `useEffect` — initialization, GA tracking, theme listeners
- `useRef` — virtualizer scroll containers, provider init guards
- `useCallback` — memoized handlers (theme setter)
- `useSyncExternalStore` — theme persistence outside React state
- `useContext` — theme context access

### Next.js Hooks
- `useRouter()` — programmatic navigation (login redirect)
- `usePathname()` — current path (GA page view tracking)
- `useSearchParams()` — query string access (filters, GA tracking)

### TanStack React Query
- `useQuery()` — data fetching (articles, auth, categories)
- `useMutation()` — data mutations (login, logout, CRUD)
- `useQueryClient()` — manual cache invalidation after mutations
- Custom wrappers: `useGetMeQuery()`, `useGetArticlesQuery()`, `useLoginMutation()`, `useCreateArticleMutation()`, etc.

### Redux (typed)
- `useAppDispatch()` — typed dispatch (auth actions)
- `useAppSelector()` — typed state selector

### TanStack Virtual
- `useVirtualizer()` — virtualize large tables in admin dashboard

### Custom Hooks
- `useTheme()` — access theme context (theme value + setter)
- `useSavedArticles()` — Zustand store (toggle, isSaved, savedIds)

---

## Styling Rules

### Approach
- **Tailwind CSS 4** with `@tailwindcss/postcss` plugin — no CSS Modules, no styled-components.
- **CSS custom properties** define the color system in `/app/globals.css`.
- **Dark mode** via `.dark` class toggled on `<html>` element.

### Color System (`--gn-*` prefix)
```
--gn-primary       Main brand color (dark)
--gn-accent        Green accent / CTAs
--gn-danger        Destructive actions (red)
--gn-surface       Background
--gn-text          Primary text
--gn-border        Borders / dividers
--gn-success       Success states
--gn-muted         Secondary text
```

All colors have corresponding dark mode overrides under `.dark {}`.

### Tailwind Class Order (enforced via `prettier-plugin-tailwindcss`)

Classes must follow this order in every `className`:

1. **Layout** — `flex`, `grid`, `block`, `inline`, `hidden`
2. **Position** — `absolute`, `relative`, `fixed`, `sticky`, `top-`, `left-`, `right-`, `bottom-`, `z-`
3. **Box model** — `w-`, `h-`, `min-w-`, `max-w-`, `p-`, `m-`, `gap-`, `overflow-`
4. **Typography** — `text-`, `font-`, `leading-`, `tracking-`, `truncate`
5. **Background** — `bg-`
6. **Border** — `border`, `rounded-`
7. **Effects** — `shadow-`, `opacity-`
8. **Transitions** — `transition-`, `duration-`, `ease-`
9. **State variants** — `hover:`, `focus:`, `active:`, `dark:`
10. **Responsive** — `sm:`, `md:`, `lg:`, `xl:` (always last)

```tsx
// Correct
<div className="flex absolute w-full p-4 text-sm bg-gn-surface border rounded-lg shadow-md transition-colors hover:bg-gn-accent sm:p-6 lg:w-1/2" />

// Wrong — responsive and state mixed into the middle
<div className="flex sm:p-6 hover:bg-gn-accent absolute w-full p-4 text-sm bg-gn-surface border rounded-lg shadow-md transition-colors lg:w-1/2" />
```

### Other Patterns
- Inline Tailwind classes directly in JSX (no `className` extraction).
- Responsive design via Tailwind breakpoint prefixes: `sm:`, `md:`, `lg:`.
- Transitions with `transition-colors`, `transition-all`.
- Custom utility: `hide-scrollbar` for horizontal overflow sections.

---

## State Management Architecture

```
Provider Tree (in layout.tsx):

<ThemeProvider>                    ← Context: theme, setTheme
  <StoreProvider>                  ← Wraps Redux + QueryClient
    <ReduxProvider store={store}>  ← Auth slice (user, isAuthenticated)
      <QueryClientProvider>        ← React Query cache
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  </StoreProvider>
</ThemeProvider>
```

| Store          | Library           | Purpose                      | Persistence       |
| -------------- | ----------------- | ---------------------------- | ------------------ |
| Auth           | Redux Toolkit     | Current user, isAuthenticated| None (cookie-based)|
| Server data    | TanStack Query    | Articles, categories, sources| In-memory cache    |
| Saved articles | Zustand           | User's saved article IDs     | localStorage       |
| Theme          | React Context     | Dark/light mode              | localStorage       |

---

## Data Fetching Patterns

### Server Components (pages)
- Import directly from `lib/data.ts` (in-memory arrays).
- Use `generateMetadata()` for dynamic SEO.
- No client-side fetching overhead.

### Client Components (admin, forms)
- Use TanStack Query hooks that call `/api/*` endpoints.
- Fetch wrapper in `lib/store/api.ts` handles errors.
- Cache: 5-minute `staleTime`, no `refetchOnWindowFocus`.
- Mutations invalidate relevant query keys on success.

### API Routes
- RESTful design with standard HTTP verbs.
- JSON request/response bodies.
- Query params for filtering: `?category=sport&search=kosova&limit=50`.
- Auth checked server-side via `requireAdmin()` for protected routes.

---

## Authentication Flow

1. **Login** — `POST /api/auth/login` verifies bcrypt hash, creates JWT (HS256, 7-day expiry), sets `httpOnly` cookie named `session`.
2. **Session restore** — `useGetMeQuery()` calls `GET /api/auth/me` on page load to restore state.
3. **Admin guard** — `requireAdmin()` in `lib/auth-guard.ts` checks JWT role; admin layout redirects anonymously.
4. **Logout** — `POST /api/auth/logout` deletes cookie, client clears Redux state and invalidates queries.

---

## API Route Patterns

```
GET    /api/articles              → list (supports ?category, ?search, ?limit)
POST   /api/articles              → create (admin only)
GET    /api/articles/[id]         → single article
PUT    /api/articles/[id]         → update (admin only)
DELETE /api/articles/[id]         → delete (admin only)
GET    /api/auth/me               → current session
POST   /api/auth/login            → authenticate
POST   /api/auth/register         → create account
POST   /api/auth/logout           → destroy session
GET    /api/categories            → list all categories
GET    /api/sources               → list all sources
```

Error responses follow `{ error: "message" }` format with appropriate HTTP status codes.

---

## Testing

### Unit / Integration (Jest)
- Located in `__tests__/` (mirrors `app/`, `components/`, `lib/` structure).
- `ts-jest` for TypeScript support.
- `jsdom` environment for component tests.
- Path alias `@/*` mapped in jest config.

### E2E (Playwright)
- Located in `e2e/` directory.
- Browser automation for full user flows.

### Scripts
```bash
npm test          # Run Jest
npm run lint      # Run ESLint
```

---

## Configuration Files

| File                | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `next.config.ts`    | Remote image domains, redirects, rewrites        |
| `tsconfig.json`     | TypeScript strict mode, path aliases (`@/*`)     |
| `postcss.config.mjs`| Tailwind CSS PostCSS plugin                      |
| `eslint.config.mjs` | ESLint 9 flat config (Next.js + TypeScript)      |
| `jest.config.ts`    | Jest with ts-jest, jsdom, path aliases           |
| `.env.local`        | `SESSION_SECRET`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`|

---

## Environment Variables

| Variable                          | Scope     | Purpose                  |
| --------------------------------- | --------- | ------------------------ |
| `SESSION_SECRET`                  | Server    | JWT signing key          |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`   | Public    | Google Analytics 4 ID    |

---

## Key Architectural Decisions

1. **In-memory data** — no database; `lib/data.ts` holds mutable arrays. Data resets on server restart. Designed for prototyping; replace with a real DB for production.
2. **Hybrid state** — Redux for auth (synchronous UI), React Query for server data (caching + refetching), Zustand for persistence (localStorage).
3. **Server-first rendering** — public pages are server components for SEO and performance; admin/interactive pages are client components.
4. **Virtualized admin table** — `@tanstack/react-virtual` renders only visible rows for performance with large article lists.
5. **Theme via `useSyncExternalStore`** — avoids hydration mismatch by syncing external (localStorage) state with React.
6. **No Prettier** — code formatting handled by ESLint rules only.
7. **No pre-commit hooks** — linting runs manually or in CI.
