# GjirafaNews Project Conventions

This document describes the stack, structure, naming rules, hook usage, styling approach, and other implementation conventions currently used in this repository.

## 1. Core Stack

- Framework: Next.js 16.2.1 using the App Router.
- UI: React 19.2.4.
- Language: TypeScript with `strict: true`.
- Styling: Tailwind CSS v4 plus project-level CSS variables in `app/globals.css`.
- Fonts: `next/font/google` with Geist Sans and Geist Mono.
- Client state: Redux Toolkit for minimal auth state.
- Server state / data fetching: TanStack Query.
- Local persisted client state: Zustand with `persist` middleware.
- List virtualization: `@tanstack/react-virtual`.
- Auth/session: JWT via `jose`, stored in an HTTP-only cookie.
- Password hashing: `bcryptjs`.
- Unit/integration tests: Jest + Testing Library.
- End-to-end tests: Playwright.

## 2. App Structure

The project follows a typical Next.js App Router layout.

- `app/`: routes, layouts, metadata files, route handlers.
- `app/api/`: server route handlers using `route.ts`.
- `app/admin/`: admin pages and admin layout.
- `app/article/[id]/`, `app/category/[slug]/`: dynamic public routes.
- `app/(auth)/`: route group exists, but the main auth page currently lives in `app/login/`.
- `components/`: reusable UI components and client-side providers.
- `lib/`: shared business logic, auth helpers, session helpers, store logic, in-memory data.
- `lib/store/`: Redux store, slice, typed hooks, Zustand store, TanStack Query hooks.
- `__tests__/`: Jest tests.
- `e2e/`: Playwright flows.
- `public/`: static assets.

## 3. Routing And Server Boundaries

- Public pages are mostly server components by default.
- Interactive pages/components explicitly opt into client mode with `"use client"`.
- API endpoints live under `app/api/**/route.ts`.
- Route protection is handled in `proxy.ts`.
- Admin pages are protected in two places:
  - `proxy.ts` redirects unauthenticated or non-admin users.
  - `app/admin/layout.tsx` performs a server-side session check and redirects if needed.
- Session helpers are split by runtime:
  - `lib/session.ts` for server-side cookie access.
  - `lib/session-edge.ts` for request-time JWT verification used by `proxy.ts`.

## 4. Data Layer Convention

Current data storage is in-memory, not a database.

- `lib/data.ts` contains the core domain types and mutable arrays for articles, users, categories, and sources.
- API routes read from and mutate those arrays directly.
- Relation joining is done with helper functions such as `getArticleWithRelations`.
- This is suitable for demo/dev behavior, but not persistent storage.

## 5. Naming Conventions

### Files and folders

- Route files use Next.js reserved names like `page.tsx`, `layout.tsx`, `route.ts`, `icon.tsx`, `robots.ts`, `sitemap.ts`.
- Reusable component filenames use kebab-case, for example:
  - `news-card.tsx`
  - `theme-toggle.tsx`
  - `admin-logout-button.tsx`
- Store files use concise lower-case names, for example:
  - `store.ts`
  - `hooks.ts`
  - `authSlice.ts`
  - `saved-articles.ts`
- Dynamic routes use Next.js segment syntax like `[id]` and `[slug]`.

### Code symbols

- React components use PascalCase.
- Type aliases use PascalCase.
- Utility functions use camelCase.
- Hook names use the `use...` pattern.
- TanStack Query hooks are named by intent:
  - Query hooks end with `Query`.
  - Mutation hooks end with `Mutation`.
- Redux slice names and actions follow standard Redux Toolkit naming.

### Import style

- The project uses the `@/*` path alias from `tsconfig.json`.
- Internal imports prefer alias-based paths like `@/components/navbar` instead of deep relative imports.

## 6. Hook Usage Conventions

Hooks are used selectively and are not centralized into a separate `hooks/` folder. They are colocated near the logic they serve.

### React hooks

- `useState` is used for local form and UI state.
- `useEffect` is used for hydration-sensitive behavior and browser-only side effects.
- `useRef` is used to keep long-lived instances stable across renders.
- `useSyncExternalStore` is used in the custom theme provider to keep theme state in sync.
- `useContext` is used through `useTheme()`.

### Custom hooks

- `useTheme()` is defined in `components/theme-provider.tsx`.
- `useSavedArticles()` is a Zustand store hook in `lib/store/saved-articles.ts`.
- `useAppDispatch()` and `useAppSelector()` are typed Redux hooks in `lib/store/hooks.ts`.
- TanStack Query hooks live in `lib/store/api.ts` and wrap all HTTP calls.

### TanStack Query pattern

- Queries and mutations are wrapped in named hooks instead of calling `useQuery` directly throughout pages.
- Query keys are centralized in `queryKeys`.
- Cache invalidation happens in mutation `onSuccess` handlers.
- Stale times are explicitly configured.
- Fetching uses one shared `api<T>()` helper.

### Client/server split

- Data-heavy page rendering is often server-side.
- Interactive elements such as save buttons, theme toggles, login forms, and admin controls are client components.
- Hydration guards are used where local storage or client-only state would otherwise mismatch server HTML.

## 7. State Management Rules

The project uses multiple state tools, each with a separate responsibility.

- Redux Toolkit:
  - Used only for minimal client auth state.
  - Store is created in `lib/store/store.ts`.
  - Auth state is stored in `lib/store/authSlice.ts`.
- TanStack Query:
  - Used for API-driven server state and cache management.
  - All query and mutation hooks are centralized in `lib/store/api.ts`.
- Zustand:
  - Used for saved articles persisted in browser storage.
  - Not used as the primary app-wide state layer.

This is a clear separation:

- Redux for lightweight client auth state.
- TanStack Query for server data.
- Zustand for persistent local UI data.

## 8. Styling Approach

The styling system is Tailwind-first with design tokens defined in CSS variables.

### Tailwind usage

- Utility classes are used directly in JSX.
- Components do not use CSS modules.
- Layout, spacing, typography, borders, and responsive behavior are expressed inline with Tailwind classes.

### Design tokens

- `app/globals.css` defines semantic variables like:
  - `--gn-primary`
  - `--gn-accent`
  - `--gn-border`
  - `--gn-text`
- Those variables are exposed to Tailwind via `@theme inline`.
- Component class names use token-driven utility names such as:
  - `bg-gn-primary`
  - `text-gn-text`
  - `border-gn-border`

### Theming

- Dark mode is supported through a `.dark` class on the root element.
- Theme selection supports `light`, `dark`, and `system`.
- Theme state is stored in `localStorage`.
- The theme provider updates `document.documentElement.classList` directly.

### Visual style

- Rounded surfaces, subtle borders, muted neutrals, and semantic accent colors are used consistently.
- The UI favors tokenized semantic colors over hard-coded per-component colors.
- Some comments indicate an intentional colorblind-safe palette.

## 9. Component Conventions

- Default export is the common pattern for React components.
- Components are generally small and focused.
- Shared UI lives in `components/`.
- Components receive explicit typed props instead of implicit shapes.
- Accessibility is considered through labels, `aria-label`, semantic elements, and visible interaction states.
- `next/image` is used for article imagery in reusable cards and detail pages where appropriate.
- `next/link` is used for internal navigation.

## 10. Next.js Conventions In Use

- Metadata is defined with the App Router metadata API.
- Dynamic route pages use async `params` handling compatible with current Next.js behavior in this project.
- Built-in app files are used for SEO and assets:
  - `app/robots.ts`
  - `app/sitemap.ts`
  - `app/icon.tsx`
  - `app/apple-icon.tsx`
- `next.config.ts` includes image remote patterns, redirects, and rewrites.

## 11. Testing Conventions

### Jest

- Tests live under `__tests__/`.
- Jest uses `ts-jest` and the `jsdom` environment.
- Testing Library is configured via `jest.setup.ts`.
- Asset and style imports are mocked through `__mocks__/`.

### Playwright

- E2E specs live under `e2e/`.
- Tests use Chromium.
- The Playwright config can start the Next.js dev server automatically.
- `fullyParallel` is disabled because the existing E2E flow depends on sequential state.

## 12. Observed Code Style Rules

- TypeScript types are used broadly, including request/response shapes.
- Comments are explanatory and often educational, especially around providers, virtualized lists, and configuration.
- Public and admin concerns are separated cleanly by route and layout.
- Server-only code is explicitly marked with `server-only` where needed.
- The codebase prefers readable helper functions over deeply nested inline logic.
- Alias imports and colocated logic are preferred over cross-project indirection.

## 13. Practical Summary

If you add new code, match these existing conventions:

- Use App Router files and folder semantics.
- Keep presentational reusable UI in `components/`.
- Put shared business logic and state helpers in `lib/`.
- Use `@/` imports.
- Use kebab-case filenames for components.
- Use PascalCase for component and type names.
- Use TanStack Query hooks for API access.
- Use Redux only where global client auth state is needed.
- Use Zustand only for simple persisted local state.
- Style with Tailwind utilities and the existing `gn-*` design tokens.
- Mark interactive browser-only components with `"use client"`.
- Keep admin protection aligned with both `proxy.ts` and server-side session checks.
