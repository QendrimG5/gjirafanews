# Dynamic Categories — Implementation Plan

**Goal:** Let admins create/delete categories from `apps/admin-web`. New categories must (a) appear in the article-create dropdown and (b) show up on the public `apps/gjirafa-news` site (homepage `CategoryBar` + `/category/[slug]` pages) without code changes or redeploys.

---

## 1. Current state (what we're changing)

| Concern | Where it lives today | Problem |
|---|---|---|
| Category storage | `apps/gjirafa-news/lib/data.ts:15-22` — hardcoded `const categories: Category[]` (mutable array, already exported) | Not mutable via API |
| List endpoint | `apps/gjirafa-news/app/api/categories/route.ts` — only `GET` | No create/delete |
| Article create form dropdown | `apps/admin-web/src/components/article-form.tsx:115-119` — already fetches via `useGetCategoriesQuery()` | ✅ Already dynamic — no change needed once API returns new categories |
| Public homepage | `apps/gjirafa-news/app/page.tsx:6,32` — `import { categories } from "@/lib/data"` at render time | Next.js may cache the RSC; mutations won't show until re-render |
| Public category page | `apps/gjirafa-news/app/category/[slug]/page.tsx:6,15,37` — same hardcoded import | Same caching concern |
| Shared types | `packages/types/src/index.ts:3-8, 92-94` — `Category`, `CategoryWithCount` | Need `CreateCategoryRequest` |
| Auth for admin mutations | `apps/gjirafa-news/lib/auth-guard.ts` — `requireAdmin()` used by `POST /api/articles` | Reuse verbatim |
| Admin-web routing | `apps/admin-web/src/App.tsx:27-39` — React Router v7 | Need new `/categories` route |
| API client | `apps/admin-web/src/lib/api.ts` — TanStack Query hooks, cookie-auth fetch wrapper | Add category mutation hooks |

**Key insight:** because `lib/data.ts`'s `categories` is a **module-level mutable array** (same pattern `articles` uses for POST `/api/articles`), we don't need a database. Mutating it in a POST handler is enough — the `GET /api/categories` and the RSC imports both read the same module binding in the same Node process. We only need to defeat Next.js's build/fetch cache on the two public pages so RSC re-reads the array per request.

---

## 2. Architecture — decisions & trade-offs

### 2.1 Persistence: in-memory vs. DB
**Decision:** Keep in-memory, matching existing `articles` pattern. Adding a DB for one feature would be inconsistent and inflate scope. **Trade-off:** categories don't survive server restarts — but neither do articles created today. If/when persistence is added, it should be a single PR covering both.

### 2.2 Public pages: fetch API vs. import module
**Decision:** Keep the `import { categories } from "@/lib/data"` pattern on RSC pages, but mark them dynamic so the RSC actually re-reads the (now mutated) module binding each request. Going through `fetch('/api/categories')` from an RSC on the same server is a wasted round-trip.

```tsx
// apps/gjirafa-news/app/page.tsx  (top of file)
export const dynamic = "force-dynamic";
```

Same for `app/category/[slug]/page.tsx`. **Trade-off:** no static optimization for these pages, but they're already dynamic in spirit (news feed).

### 2.3 Slug generation: client vs. server
**Decision:** Server-side. Let admins pick a `name` and `color` only; derive `slug` from `name` (lowercase, strip diacritics, hyphenate). Prevents conflicting / ugly slugs and keeps the form minimal. Client may optionally send a slug override.

### 2.4 Validation
**Decision:** Manual, matching the existing `POST /api/articles` style. No Zod yet — adding it for one endpoint would be noise.

### 2.5 Delete semantics
**Decision:** Block deletion of any category that still has articles. Return `409 Conflict` with a count. Cascading delete would silently destroy content; renaming a leftover `categoryId` is ambiguous.

---

## 3. Implementation steps

### Step 1 — Extend shared types
**File:** `packages/types/src/index.ts` (add near line 94)

```ts
export type CreateCategoryRequest = {
  name: string;
  color?: string;   // default "#1a7f37"
  slug?: string;    // server derives from name if absent
};

export type CategoryResponse = Category;
```

### Step 2 — Add ID + slug helpers in `lib/data.ts`
**File:** `apps/gjirafa-news/lib/data.ts` (append near the other `createIdGenerator` calls on line 208)

```ts
const generateCategoryIdFn = createIdGenerator("cat-", categories.length);
export function generateCategoryId(): string {
  return generateCategoryIdFn();
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // strip diacritics (Albanian ë, ç, etc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

**Why slugify here:** the helper is data-layer, not route-layer. If later a seed script or another handler needs it, they import it cleanly.

### Step 3 — Add `POST` and `DELETE` to `/api/categories`
**File:** `apps/gjirafa-news/app/api/categories/route.ts` — rewrite

```ts
import { NextRequest } from "next/server";
import {
  categories,
  articles,
  generateCategoryId,
  slugify,
} from "@/lib/data";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/categories — public list with article counts
export async function GET() {
  const withCount = categories.map((cat) => ({
    ...cat,
    articleCount: articles.filter((a) => a.categoryId === cat.id).length,
  }));
  return Response.json(withCount);
}

// POST /api/categories — admin only
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "#1a7f37";
  const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return Response.json({ error: "Could not derive a valid slug" }, { status: 400 });
  }
  if (categories.some((c) => c.slug === slug)) {
    return Response.json({ error: "Slug already exists" }, { status: 409 });
  }
  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return Response.json({ error: "Name already exists" }, { status: 409 });
  }

  const newCategory = { id: generateCategoryId(), name, slug, color };
  categories.push(newCategory);

  return Response.json(newCategory, { status: 201 });
}
```

**File:** `apps/gjirafa-news/app/api/categories/[id]/route.ts` — new file

```ts
import { NextRequest } from "next/server";
import { categories, articles } from "@/lib/data";
import { requireAdmin } from "@/lib/auth-guard";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const inUse = articles.filter((a) => a.categoryId === id).length;
  if (inUse > 0) {
    return Response.json(
      { error: `Category has ${inUse} article(s). Reassign or delete them first.` },
      { status: 409 },
    );
  }

  const [removed] = categories.splice(idx, 1);
  return Response.json({ message: "deleted", id: removed.id });
}
```

**Why `Promise<{ id: string }>`:** matches the async-params signature used by the existing `app/api/articles/[id]/route.ts`.

### Step 4 — Make public pages re-read the array
**File:** `apps/gjirafa-news/app/page.tsx` (add line 1)

```tsx
export const dynamic = "force-dynamic";
```

**File:** `apps/gjirafa-news/app/category/[slug]/page.tsx` (add after the imports)

```tsx
export const dynamic = "force-dynamic";
```

**Why:** without this, Next.js may fully static-render these pages at build time. Since `categories` is a module binding that's mutated at runtime, a statically-rendered RSC would keep serving the original six categories.

`generateMetadata` in `category/[slug]/page.tsx` is already dynamic per-request, so adding a new slug will resolve once the category exists.

### Step 5 — Admin-web: category API hooks
**File:** `apps/admin-web/src/lib/api.ts` — append

```ts
import type { CreateCategoryRequest, Category } from "@gjirafanews/types";

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) =>
      api<Category>("/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ message: string; id: string }>(`/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
```

### Step 6 — Admin-web: new page with form + list
**File:** `apps/admin-web/src/pages/categories.tsx` — new

```tsx
import { useState } from "react";
import { Input, Button } from "@gjirafanews/ui";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/lib/api";

export default function CategoriesPage() {
  const { data: categories } = useGetCategoriesQuery();
  const createMut = useCreateCategoryMutation();
  const deleteMut = useDeleteCategoryMutation();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#1a7f37");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Emri eshte i detyrueshem.");
      return;
    }
    try {
      await createMut.mutateAsync({ name: name.trim(), color });
      setName("");
      setColor("#1a7f37");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Gabim gjate krijimit.";
      setError(msg);
    }
  }

  async function handleDelete(id: string, hasArticles: boolean) {
    if (hasArticles && !confirm("Kjo kategori ka artikuj. Anulo?")) return;
    try {
      await deleteMut.mutateAsync(id);
    } catch (err: unknown) {
      alert(
        (err as { data?: { error?: string } })?.data?.error ??
          "Gabim gjate fshirjes.",
      );
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Kategorite</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-gn-danger bg-gn-danger-muted rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Emri *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p.sh. Shendetesi"
        />
        <div>
          <label className="mb-1 block text-sm font-medium">Ngjyra</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 rounded border"
          />
        </div>
        <Button type="submit" disabled={createMut.isPending}>
          {createMut.isPending ? "Duke ruajtur..." : "Shto kategorine"}
        </Button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Ekzistuese</h2>
        <ul className="divide-gn-border-light divide-y rounded-lg border">
          {categories?.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-medium">{c.name}</span>
                <span className="text-gn-text-tertiary text-xs">
                  /{c.slug} · {c.articleCount} artikuj
                </span>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.articleCount > 0)}
                className="text-gn-danger text-sm hover:underline"
                disabled={deleteMut.isPending}
              >
                Fshi
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Step 7 — Wire the route + nav link
**File:** `apps/admin-web/src/App.tsx` — add import + `<Route>`

```tsx
import CategoriesPage from "./pages/categories";
// ...
<Route path="/articles/:id/edit" element={<EditArticlePage />} />
<Route path="/categories" element={<CategoriesPage />} />   {/* NEW */}
```

**File:** `apps/admin-web/src/components/admin-layout.tsx` — add nav link next to "+ Artikull i ri" (line 17)

```tsx
<Link
  to="/categories"
  className="text-xs text-white/60 transition-colors hover:text-white"
>
  Kategorite
</Link>
```

### Step 8 — Article form: no change required
`article-form.tsx:31` already uses `useGetCategoriesQuery()` and renders options from the API. Because TanStack Query caches under `queryKeys.categories` and both the category page and the article form share that key, invalidation from Step 5's mutations refreshes the dropdown automatically. ✅

---

## 4. Execution order (PR-ready sequence)

1. `packages/types` — add `CreateCategoryRequest` (tiny, foundational).
2. `lib/data.ts` — add `generateCategoryId`, `slugify`.
3. `app/api/categories/route.ts` + `app/api/categories/[id]/route.ts` — POST/DELETE.
4. `app/page.tsx` + `app/category/[slug]/page.tsx` — `export const dynamic = "force-dynamic"`.
5. `admin-web/src/lib/api.ts` — mutation hooks.
6. `admin-web/src/pages/categories.tsx` — new page.
7. `admin-web/src/App.tsx` + `admin-layout.tsx` — route + nav.
8. Manual verification (§5).

Each step compiles on its own, so the branch can be rebased / split into commits cleanly.

---

## 5. Manual verification

Start both servers (from repo root):
```
pnpm --filter gjirafa-news dev        # port 3000
pnpm --filter admin-web dev           # port 3002
```

1. Log in at `localhost:3002/login` with `admin@gjirafanews.com`.
2. Navigate to `/categories`, create **"Shendetesi"** with a teal color.
3. `GET localhost:3000/api/categories` → new entry present with `articleCount: 0`.
4. `/articles/new` → dropdown shows "Shendetesi". Create an article under it.
5. `localhost:3000/` → `CategoryBar` contains "Shendetesi".
6. `localhost:3000/category/shendetesi` → renders, shows the new article.
7. Back in admin `/categories`: delete a different empty category → succeeds. Try deleting "Shendetesi" (has 1 article) → 409 error surfaced.

---

## 6. Edge cases handled

| Case | Handling |
|---|---|
| Duplicate name | 409 before insert |
| Duplicate slug (user-supplied) | 409 before insert |
| Name that slugifies to `""` (e.g. "???") | 400 |
| Delete a category with articles | 409 with count |
| Unauthenticated POST/DELETE | `requireAdmin()` returns 401/403 |
| Albanian diacritics (`Shëndetësi` → `shendetesi`) | `slugify` NFD-strips |
| Next.js caching stale categories on public pages | `export const dynamic = "force-dynamic"` |
| Admin form dropdown stale after create | TanStack `invalidateQueries(queryKeys.categories)` |

---

## 7. Deferred / out of scope

- **Category edit** (rename, recolor). Add later if needed — same pattern (PATCH).
- **Persistence across server restarts.** Should be part of a broader DB migration for articles + users too.
- **Soft delete / reassignment flow** for non-empty categories. Current 409 is the MVP safeguard.
- **Zod validation.** Introduce once a second endpoint shares schemas.
- **i18n of admin labels.** Page copy is Albanian inline, matching existing admin pages.
