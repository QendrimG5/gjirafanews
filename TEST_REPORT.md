# GjirafaNews — Unit Test Report

**Test Framework:** Jest 30 + React Testing Library
**Total Test Suites:** 14
**Total Tests:** 171
**Pass Rate:** 100% (171/171)

---

## Table of Contents

1. [Test Architecture Overview](#test-architecture-overview)
2. [Data Layer Tests — `lib/data.ts`](#1-data-layer-tests--libdatats)
3. [Redux Auth Slice Tests — `lib/store/authSlice.ts`](#2-redux-auth-slice-tests--libstoreauthslicets)
4. [Redux Store Tests — `lib/store/store.ts`](#3-redux-store-tests--libstorestoretsrun)
5. [Zustand Saved Articles Tests — `lib/store/saved-articles.ts`](#4-zustand-saved-articles-tests--libstoresaved-articlests)
6. [TanStack Query Keys Tests — `lib/store/api.ts`](#5-tanstack-query-keys-tests--libstoreapits)
7. [NewsCard Component Tests — `components/news-card.tsx`](#6-newscard-component-tests--componentsnews-cardtsx)
8. [CategoryBar Component Tests — `components/category-bar.tsx`](#7-categorybar-component-tests--componentscategory-bartsx)
9. [SaveButton Component Tests — `components/save-button.tsx`](#8-savebutton-component-tests--componentssave-buttontsx)
10. [SavedCount Component Tests — `components/saved-count.tsx`](#9-savedcount-component-tests--componentssaved-counttsx)
11. [Navbar Component Tests — `components/navbar.tsx`](#10-navbar-component-tests--componentsnavbartsx)
12. [BottomNav Component Tests — `components/bottom-nav.tsx`](#11-bottomnav-component-tests--componentsbottom-navtsx)
13. [AuthNavLink Component Tests — `components/auth-nav-link.tsx`](#12-authnavlink-component-tests--componentsauth-nav-linktsx)
14. [AdminLogoutButton Component Tests — `components/admin-logout-button.tsx`](#13-adminlogoutbutton-component-tests--componentsadmin-logout-buttontsx)
15. [ArticleForm Component Tests — `components/article-form.tsx`](#14-articleform-component-tests--componentsarticle-formtsx)
16. [Jest Matchers Reference](#jest-matchers-reference)

---

## Test Architecture Overview

### Tools Used

| Tool | Purpose |
|------|---------|
| **Jest 30** | Test runner, assertion library, mocking framework |
| **ts-jest** | TypeScript compilation for test files |
| **React Testing Library** | DOM-based component rendering and querying |
| **@testing-library/jest-dom** | Extended DOM matchers (toBeInTheDocument, etc.) |
| **@testing-library/user-event** | Realistic user interaction simulation |
| **jest-environment-jsdom** | Browser-like DOM environment for tests |

### File Structure

```
__tests__/
  lib/
    data.test.ts                  — Data types, arrays, helpers (47 tests)
    store/
      authSlice.test.ts           — Redux auth reducer (11 tests)
      store.test.ts               — Redux store configuration (6 tests)
      saved-articles.test.ts      — Zustand saved articles store (13 tests)
      api.test.ts                 — TanStack Query keys (9 tests)
  components/
    news-card.test.tsx            — NewsCard + timeAgo utility (19 tests)
    category-bar.test.tsx         — CategoryBar navigation (10 tests)
    save-button.test.tsx          — SaveButton bookmark toggle (10 tests)
    saved-count.test.tsx          — SavedCount badge (8 tests)
    navbar.test.tsx               — Navbar top navigation (8 tests)
    bottom-nav.test.tsx           — BottomNav mobile navigation (13 tests)
    auth-nav-link.test.tsx        — AuthNavLink conditional link (6 tests)
    admin-logout-button.test.tsx  — AdminLogoutButton (7 tests)
    article-form.test.tsx         — ArticleForm CRUD form (11 tests)
```

### Mocking Strategy

- **Next.js `Link`**: Mocked as a plain `<a>` tag so we can test `href` values
- **Next.js `useRouter`**: Mocked to track `router.push()` calls
- **Next.js `usePathname`**: Mocked via variable to simulate URL changes
- **Zustand stores**: Mocked in component tests to avoid persist/hydration issues; tested directly via `getState()` in unit tests
- **TanStack Query hooks**: Mocked to return controlled data/loading states
- **Redux hooks**: Mocked to track `dispatch()` calls
- **`server-only` package**: Mocked as empty module (it throws in non-server envs)

---

## 1. Data Layer Tests — `lib/data.ts`

**File:** `__tests__/lib/data.test.ts`
**Tests:** 47
**What it tests:** The core data module — types, arrays, and helper functions

### What `lib/data.ts` does

This is the foundation of the entire app. It defines:
- **Type definitions**: `Category`, `Source`, `Article`, `User`, `SafeUser`, `ArticleWithRelations`
- **Static arrays**: `categories` (6 items), `sources` (4 items), `articles` (16 items), `users` (1 admin)
- **`getArticleWithRelations(article)`**: Joins an article with its category and source by looking up `categoryId` and `sourceId`
- **`generateId()` / `generateUserId()`**: Sequential ID generators (`art-17`, `usr-2`, etc.)

### Test Groups

#### Categories (6 tests)
| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Non-empty array | Categories exist | `toBeGreaterThan(0)` |
| Exactly 6 | Count matches seed data | `toHaveLength(6)` |
| Required fields | id, name, slug, color all present and strings | `toBeDefined()`, `typeof` |
| Unique IDs | No duplicate category IDs | `Set.size === length` |
| Unique slugs | No URL routing conflicts | `Set.size === length` |
| Valid hex colors | Colors render correctly in CSS | `toMatch(/^#([0-9a-fA-F]{3\|6})$/)` |

#### Sources (5 tests)
| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Non-empty array | Sources exist | `toBeGreaterThan(0)` |
| Exactly 4 | Count matches seed data | `toHaveLength(4)` |
| Required fields | id, name, url all strings | `toBeDefined()` |
| Unique IDs | No duplicate source IDs | `Set.size` |
| HTTPS URLs | All links are secure | `toMatch(/^https:\/\//)` |

#### Articles (8 tests)
| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Non-empty | Articles exist | `toBeGreaterThan(0)` |
| At least 16 | Seed data intact | `toBeGreaterThanOrEqual(16)` |
| All fields present | Complete article shape | `toBeDefined()`, `typeof` |
| Unique IDs | No duplicates | `Set.size` |
| Valid categoryId | No orphaned references | `categoryIds.has()` |
| Valid sourceId | No orphaned references | `sourceIds.has()` |
| Valid dates | ISO format parseable | `isNaN(date.getTime()) === false` |
| Positive readTime | No zero/negative values | `toBeGreaterThan(0)` |

#### getArticleWithRelations (5 tests)
| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Merges correctly | Category + source attached | `result.category.id === article.categoryId` |
| Category shape | name, slug, color present | `toBeDefined()` |
| Source shape | name, url present | `toBeDefined()` |
| Works for all articles | No orphaned foreign keys | `forEach` + assertions |
| Preserves fields | Spread doesn't lose properties | `toEqual()` on each field |

#### generateId / generateUserId (7 tests)
| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Returns string | Correct type | `typeof === "string"` |
| Format `art-{n}` | Pattern match | `toMatch(/^art-\d+$/)` |
| Unique per call | Counter increments | `not.toEqual()` |
| Incrementing | Sequential numbers | `num2 === num1 + 1` |
| User ID format | `usr-{n}` pattern | `toMatch(/^usr-\d+$/)` |

#### Users (4 tests)
| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Admin exists | Default admin in seed data | `find()` + `toBeDefined()` |
| Admin fields | Correct role and name | `toEqual("admin")` |
| bcrypt hash | Password properly hashed | `toMatch(/^\$2[ab]\$/)` |
| All required fields | Complete user shape | `["admin","user"].toContain(role)` |

---

## 2. Redux Auth Slice Tests — `lib/store/authSlice.ts`

**File:** `__tests__/lib/store/authSlice.test.ts`
**Tests:** 11
**What it tests:** Redux reducer, `setUser` and `clearUser` actions

### What `authSlice.ts` does

A Redux Toolkit slice that manages client-side authentication state:
- **State**: `{ user: SafeUser | null, isAuthenticated: boolean }`
- **`setUser(user)`**: Sets `user` and flips `isAuthenticated = true`
- **`clearUser()`**: Resets `user = null` and `isAuthenticated = false`

### How Redux reducers are tested

Redux reducers are **pure functions**: `(state, action) => newState`. We test them by:
1. Defining a previous state
2. Calling the reducer with that state + an action
3. Asserting the new state matches expectations

### Test Groups

#### Initial State (1 test)
Reducer receives `undefined` state → returns `{ user: null, isAuthenticated: false }`

#### setUser (4 tests)
| Test | Reasoning |
|------|-----------|
| Sets user object | Verifies the reducer stores the payload |
| Sets isAuthenticated=true | Flag must flip to enable protected UI |
| Replaces existing user | Switching accounts should work |
| Preserves all fields | No properties lost during assignment |

#### clearUser (3 tests)
| Test | Reasoning |
|------|-----------|
| Clears user to null | Logout removes user data |
| Sets isAuthenticated=false | Revokes access to protected UI |
| Idempotent on empty state | Clearing empty state doesn't crash |

#### Full Cycle (2 tests)
| Test | Reasoning |
|------|-----------|
| Login → logout cycle | End-to-end state transitions |
| Multiple cycles | No state leaking between users |

---

## 3. Redux Store Tests — `lib/store/store.ts`

**File:** `__tests__/lib/store/store.test.ts`
**Tests:** 6
**What it tests:** Store factory function and reducer registration

### What `store.ts` does

Exports `makeStore()` — a factory that creates a Redux store with `configureStore()` and registers the auth reducer.

### Test Details

| Test | What it verifies | Why it matters |
|------|-----------------|----------------|
| Creates a store | `makeStore()` returns a valid store object | StoreProvider depends on this |
| Independent instances | Each call returns a fresh store | Test isolation, no shared state |
| Has auth slice | `state.auth` exists in the state tree | Reducer is properly registered |
| Correct initial state | auth starts as null/false | App starts in logged-out state |
| Accepts dispatches | setUser action updates state | Store is functional, not read-only |
| Handles clearUser | Login→logout works through real store | Full integration of store + reducer |

---

## 4. Zustand Saved Articles Tests — `lib/store/saved-articles.ts`

**File:** `__tests__/lib/store/saved-articles.test.ts`
**Tests:** 13
**What it tests:** Zustand store for bookmarking articles

### What `saved-articles.ts` does

A Zustand store with `persist` middleware that saves to localStorage:
- **`savedIds: string[]`** — array of saved article IDs
- **`toggle(id)`** — adds if not saved, removes if saved
- **`isSaved(id)`** — returns boolean

### Testing Zustand Outside React

Zustand stores expose `getState()` and `setState()` on the store object itself. This allows testing without rendering React components:

```ts
useSavedArticles.getState().toggle("art-1");
expect(useSavedArticles.getState().savedIds).toContain("art-1");
```

### Test Groups

| Test | What it verifies | Key matcher |
|------|-----------------|-------------|
| Empty initial state | Starts with no saved articles | `toEqual([])` |
| API shape | toggle and isSaved are functions | `typeof === "function"` |
| Toggle adds | New ID appears in array | `toContain("art-1")` |
| Toggle multiple | Handles multiple saves | `toHaveLength(3)` |
| Toggle removes | Second toggle removes | `not.toContain()` |
| Targeted removal | Only removes specified ID | Other IDs still `toContain` |
| Re-add after remove | Third toggle re-adds | `toContain` after 3 toggles |
| isSaved false | Unsaved articles return false | `toBe(false)` |
| isSaved true | Saved articles return true | `toBe(true)` |
| isSaved after unsave | Returns false after removal | `toBe(false)` |
| Distinguishes IDs | Different results for different IDs | Mixed `true`/`false` |
| Empty string ID | Edge case doesn't crash | `toContain("")` |
| 100 articles | Stress test at scale | `toHaveLength(100)` |

---

## 5. TanStack Query Keys Tests — `lib/store/api.ts`

**File:** `__tests__/lib/store/api.test.ts`
**Tests:** 9
**What it tests:** Query key factory structure

### What `queryKeys` does

Centralized key factory for TanStack Query cache management:

```ts
queryKeys.auth.me         → ["auth", "me"]
queryKeys.articles.all    → ["articles"]
queryKeys.articles.detail("art-1") → ["articles", "art-1"]
queryKeys.categories      → ["categories"]
queryKeys.sources         → ["sources"]
```

### Why Query Keys Matter

TanStack Query uses these keys to:
1. **Cache data** — same key = same cache entry
2. **Invalidate caches** — `invalidateQueries(["articles"])` invalidates ALL keys starting with `["articles"]`
3. **Deduplicate requests** — two components using the same key share one fetch

### Test Details

| Test | What it verifies | Why it matters |
|------|-----------------|----------------|
| auth.me structure | `["auth", "me"]` | Login/logout invalidation |
| auth.me length | Exactly 2 elements | Prefix matching precision |
| articles.all | `["articles"]` | List cache key |
| articles.detail | `["articles", id]` | Single article cache |
| Detail uniqueness | Different IDs → different keys | No cache collisions |
| Prefix matching | detail[0] === all[0] | Invalidating list also invalidates details |
| categories key | `["categories"]` | Category dropdown cache |
| sources key | `["sources"]` | Source dropdown cache |
| Key isolation | All first elements are unique | No accidental cross-invalidation |

---

## 6. NewsCard Component Tests — `components/news-card.tsx`

**File:** `__tests__/components/news-card.test.tsx`
**Tests:** 19 (10 timeAgo + 9 component)
**What it tests:** Article card rendering + timeAgo utility

### What `news-card.tsx` does

Renders an article preview card with:
- Image with category badge overlay
- SaveButton in the top-right corner
- Title, summary, source name, relative time, read time
- Links to `/article/{id}`

Contains a local `timeAgo(dateStr)` function that formats dates as relative times.

### timeAgo Tests (10 tests)

The `timeAgo` function converts ISO date strings to relative time labels:

| Input | Output | Test |
|-------|--------|------|
| Now | `"0m"` | Exact boundary |
| 5 mins ago | `"5m"` | Minutes format |
| 59 mins ago | `"59m"` | Upper boundary of minutes |
| 60 mins ago | `"1h"` | Transition to hours |
| 23 hours ago | `"23h"` | Upper boundary of hours |
| 24 hours ago | `"1d"` | Transition to days |
| 7 days ago | `"7d"` | One week |
| 30 days ago | `"30d"` | One month |

### Component Tests (9 tests)

| Test | How it works |
|------|-------------|
| Renders title | `screen.getByText("Test Article Title")` |
| Renders summary | `screen.getByText(summary)` |
| Renders category | `screen.getByText("Sport")` — badge text |
| Renders source | `screen.getByText("Test Source")` — metadata |
| Renders read time | `screen.getByText("5 min")` — metadata |
| Correct link | `querySelector("a").href === "/article/art-1"` |
| Image alt/src | `getByAltText` + `getAttribute("src")` |
| SaveButton present | `getByTestId("save-btn-art-1")` — mocked child |
| Dynamic content | Different props → different render |

---

## 7. CategoryBar Component Tests — `components/category-bar.tsx`

**File:** `__tests__/components/category-bar.test.tsx`
**Tests:** 10
**What it tests:** Horizontal category navigation with active state

### What `category-bar.tsx` does

- Renders a sticky horizontal bar with category links
- "Te gjitha" (All) link always first, pointing to `/`
- Each category links to `/category/{slug}`
- Highlights the active category based on `usePathname()`

### Active State Logic

```ts
const activeSlug = pathname.startsWith("/category/") ? pathname.split("/")[2] : null;
// activeSlug is null → "Te gjitha" is active
// activeSlug === cat.slug → that category is active
```

### Test Details

| Test | Mock Setup | Assertion |
|------|------------|-----------|
| "Te gjitha" renders | Default | `getByText("Te gjitha")` |
| "Te gjitha" href | Default | `href === "/"` |
| Category names | 3 test categories | All names in DOM |
| Category hrefs | Default | `/category/{slug}` |
| Link count | 3 categories | `4 = 3 + 1` links |
| Active on homepage | `pathname = "/"` | "Te gjitha" has `bg-gn-primary` |
| Active on category | `pathname = "/category/sport"` | "Sport" has `bg-gn-primary` |
| Inactive styling | `pathname = "/category/sport"` | "Politika" lacks `bg-gn-primary` |
| Empty categories | `[]` | Only "Te gjitha" renders |

---

## 8. SaveButton Component Tests — `components/save-button.tsx`

**File:** `__tests__/components/save-button.test.tsx`
**Tests:** 10
**What it tests:** Bookmark toggle button with Zustand integration

### What `save-button.tsx` does

- Reads `toggle` and `isSaved` from the Zustand store
- Renders a button with a bookmark SVG icon
- On click: calls `e.preventDefault()`, `e.stopPropagation()`, then `toggle(articleId)`
- Changes `aria-label` based on saved state
- Changes visual style (accent bg when saved)

### Why preventDefault Matters

SaveButton sits inside a `<Link>` (NewsCard wraps everything in a link). Without `preventDefault()`, clicking the bookmark navigates to the article detail page instead of saving it.

### Test Details

| Test | Mock State | Assertion |
|------|------------|-----------|
| Renders button | Default (unsaved) | `getByRole("button")` |
| Unsaved aria-label | `isSaved=false` | `"Ruaj per me vone"` |
| Saved aria-label | `isSaved=true` | `"Hiq nga te ruajtura"` |
| Calls toggle | Click | `mockToggle("art-1")` |
| Single call per click | Click once | `toHaveBeenCalledTimes(1)` |
| Correct ID | `articleId="art-42"` | `mockToggle("art-42")` |
| preventDefault | Custom event | `preventDefaultCalled === true` |
| Style changes | Saved vs unsaved | `className` differs |
| Accent bg when saved | `isSaved=true` | `toContain("bg-gn-accent")` |
| SVG icon | Default | `querySelector("svg")` |

---

## 9. SavedCount Component Tests — `components/saved-count.tsx`

**File:** `__tests__/components/saved-count.test.tsx`
**Tests:** 8
**What it tests:** Bookmark count badge in navbar

### What `saved-count.tsx` does

- Renders a link to `/saved` with a bookmark icon
- Shows a count badge when `savedIds.length > 0`
- Hides the badge when count is 0
- Sets `aria-label` with the count for accessibility

### Test Details

| Test | Mock State | Assertion |
|------|------------|-----------|
| Renders link | Empty | `getByRole("link")` |
| Links to /saved | Empty | `href === "/saved"` |
| 0 count aria-label | Empty | `"0 artikuj te ruajtur"` |
| No badge at 0 | Empty | `queryByText("0") === null` |
| Badge at 3 | 3 IDs | `getByText("3")` |
| Count aria-label | 2 IDs | `"2 artikuj te ruajtur"` |
| Updates on change | 1→2 IDs | rerender shows "2" |
| SVG icon | Default | `querySelector("svg")` |

---

## 10. Navbar Component Tests — `components/navbar.tsx`

**File:** `__tests__/components/navbar.test.tsx`
**Tests:** 8
**What it tests:** Top navigation bar rendering

### What `navbar.tsx` does

- Renders GjirafaNews branding (logo + name)
- "Temat" (Topics) link to `/topics`
- SavedCount component
- AuthNavLink component
- Sticky header at top of viewport

### Mocking Strategy

SavedCount and AuthNavLink are mocked as simple `<div>` elements with `data-testid`. This isolates Navbar's own rendering logic from its children's dependencies (Zustand store, TanStack Query).

### Test Details

| Test | Assertion |
|------|-----------|
| Brand "Gjirafa" + "News" | Both text elements in DOM |
| "G" logo | Logo letter rendered |
| Brand links to / | `href === "/"` |
| "Temat" link | Text in DOM |
| "Temat" href | `/topics` |
| SavedCount present | `data-testid="saved-count"` |
| AuthNavLink present | `data-testid="auth-nav-link"` |
| Header element | `querySelector("header")` |

---

## 11. BottomNav Component Tests — `components/bottom-nav.tsx`

**File:** `__tests__/components/bottom-nav.test.tsx`
**Tests:** 13
**What it tests:** Mobile bottom navigation bar

### What `bottom-nav.tsx` does

- Fixed bottom bar visible only on mobile (`sm:hidden`)
- Three items: Ballina (`/`), Ruajtura (`/saved`), Temat (`/topics`)
- Highlights active item via `usePathname()`
- Shows saved count badge on "Ruajtura" when count > 0
- Each item has an SVG icon + label

### Test Details

| Test | Mock Setup | Assertion |
|------|------------|-----------|
| Nav element | Default | `getByRole("navigation")` |
| "Ballina" link | Default | Text in DOM |
| "Ruajtura" link | Default | Text in DOM |
| "Temat" link | Default | Text in DOM |
| 3 links total | Default | `getAllByRole("link").length === 3` |
| Ballina href | Default | `"/"` |
| Ruajtura href | Default | `"/saved"` |
| Temat href | Default | `"/topics"` |
| No badge at 0 | Empty | `queryByText("0") === null` |
| Badge at 5 | 5 IDs | `getByText("5")` |
| Active Ballina | `pathname="/"` | `text-gn-accent` class |
| Active Ruajtura | `pathname="/saved"` | `text-gn-accent` class |
| Active Temat | `pathname="/topics"` | `text-gn-accent` class |

---

## 12. AuthNavLink Component Tests — `components/auth-nav-link.tsx`

**File:** `__tests__/components/auth-nav-link.test.tsx`
**Tests:** 6
**What it tests:** Conditional auth/admin link in navbar

### What `auth-nav-link.tsx` does

Three states based on `useGetMeQuery()`:
1. **Loading** → renders `null` (nothing)
2. **Admin user** → renders "Admin" link to `/admin`
3. **Not logged in / regular user** → renders "Kyqu" (Login) link to `/login`

### Test Details

| Test | Mock State | Expected Render |
|------|------------|-----------------|
| Loading | `isLoading=true` | `null` (empty) |
| Not logged in | `data=undefined` | "Kyqu" → `/login` |
| Admin user | `role="admin"` | "Admin" → `/admin` |
| Regular user | `role="user"` | "Kyqu" → `/login` |
| Null user | `user=null` | "Kyqu" → `/login` |
| Admin styling | `role="admin"` | `bg-gn-primary` class |

---

## 13. AdminLogoutButton Component Tests — `components/admin-logout-button.tsx`

**File:** `__tests__/components/admin-logout-button.test.tsx`
**Tests:** 7
**What it tests:** Logout button with mutation + Redux + navigation

### What `admin-logout-button.tsx` does

On click:
1. Calls `logout()` mutation (POST /api/auth/logout)
2. Dispatches `clearUser()` to clear Redux auth state
3. Navigates to `/` via `router.push`

### Testing Async Operations

The click handler is `async` — it awaits the logout mutation. We use `waitFor()` from Testing Library to handle the async flow:

```ts
fireEvent.click(button);
await waitFor(() => {
  expect(mockLogout).toHaveBeenCalled();
});
```

### Test Details

| Test | Assertion |
|------|-----------|
| Renders "Dil" button | Text + `<button>` tag |
| Calls logout mutation | `mockLogout` was called |
| Dispatches clearUser | `mockDispatch({ type: "auth/clearUser" })` |
| Navigates to "/" | `mockPush("/")` |
| Correct operation order | `["logout", "dispatch", "push"]` |
| Disabled while pending | `isPending=true` → `toBeDisabled()` |
| Enabled normally | `isPending=false` → `not.toBeDisabled()` |

---

## 14. ArticleForm Component Tests — `components/article-form.tsx`

**File:** `__tests__/components/article-form.test.tsx`
**Tests:** 11
**What it tests:** Reusable article create/edit form

### What `article-form.tsx` does

- Renders form fields: title, summary, content, imageUrl, category, source, readTime
- Fetches categories/sources via TanStack Query for dropdown `<select>` elements
- Validates required fields before calling `onSubmit`
- Supports create mode (empty form) and edit mode (pre-filled with `initialData`)
- Shows error messages for validation failures and server errors

### Test Groups

#### Rendering (6 tests)
| Test | Assertion |
|------|-----------|
| All labels | 7 field labels in DOM |
| Category dropdown | Placeholder + 2 options |
| Source dropdown | Placeholder + 2 options |
| Submit button | Shows `submitLabel` prop |
| Loading state | Shows "Duke ruajtur..." |
| Disabled state | Button disabled while submitting |

#### Validation (2 tests)
| Test | Assertion |
|------|-----------|
| Empty submit | Error message shown, onSubmit not called |
| No initial error | Error not visible before first submit |

#### Form Input (1 test)
| Test | Assertion |
|------|-----------|
| Title input | `fireEvent.change` → `toHaveValue("New Title")` |

#### Edit Mode (2 tests)
| Test | Assertion |
|------|-----------|
| Pre-filled fields | `initialData` populates title input |
| Default readTime | Create mode starts at 3 |

#### Submission (2 tests)
| Test | Assertion |
|------|-----------|
| Successful submit | `onSubmit` called with matching data |
| Server error | Error message displayed when `onSubmit` rejects |

---

## Jest Matchers Reference

Every matcher used in these tests, explained:

### Equality Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toBe(value)` | Strict equality (`===`) — same reference or primitive | `expect(true).toBe(true)` |
| `toEqual(value)` | Deep equality — checks all properties recursively | `expect({a:1}).toEqual({a:1})` |
| `not.toEqual()` | Deep inequality | `expect(id1).not.toEqual(id2)` |

### Truthiness Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toBeDefined()` | Not `undefined` | `expect(cat.id).toBeDefined()` |
| `toBeNull()` | Strictly `null` | `expect(state.user).toBeNull()` |

### Number Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toBeGreaterThan(n)` | `value > n` | `expect(arr.length).toBeGreaterThan(0)` |
| `toBeGreaterThanOrEqual(n)` | `value >= n` | `expect(articles.length).toBeGreaterThanOrEqual(16)` |

### String Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toMatch(regex)` | Tests against a regular expression | `expect(id).toMatch(/^art-\d+$/)` |
| `toContain(str)` | Checks if string contains substring | `expect(className).toContain("bg-gn-primary")` |

### Array Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toHaveLength(n)` | Checks `.length` property | `expect(arr).toHaveLength(6)` |
| `toContain(item)` | Array includes the item | `expect(ids).toContain("art-1")` |
| `not.toContain(item)` | Array does not include | `expect(ids).not.toContain("art-1")` |

### Mock Function Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toHaveBeenCalled()` | Function was invoked at least once | `expect(mockFn).toHaveBeenCalled()` |
| `toHaveBeenCalledWith(args)` | Called with specific arguments | `expect(mock).toHaveBeenCalledWith("art-1")` |
| `toHaveBeenCalledTimes(n)` | Called exactly n times | `expect(mock).toHaveBeenCalledTimes(1)` |

### DOM Matchers (from @testing-library/jest-dom)
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toBeInTheDocument()` | Element exists in the DOM | `expect(el).toBeInTheDocument()` |
| `toBeDisabled()` | Element has `disabled` attribute | `expect(button).toBeDisabled()` |
| `toHaveValue(val)` | Input/select has the given value | `expect(input).toHaveValue("text")` |

### Object Matchers
| Matcher | What it does | Example |
|---------|-------------|---------|
| `toBeInstanceOf(Class)` | Checks prototype chain | `expect(arr).toBeInstanceOf(Array)` |
| `expect.objectContaining({})` | Partial match on object properties | `expect(fn).toHaveBeenCalledWith(expect.objectContaining({title:"x"}))` |

---

## Running the Tests

```bash
# Run all tests with verbose output
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run a specific test file
npx jest __tests__/lib/data.test.ts

# Run tests matching a pattern
npx jest --testPathPattern="components"
```
