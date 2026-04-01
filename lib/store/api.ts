import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { SafeUser } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────
// These describe the shape of data flowing between client and server.
// Kept here so every hook and consumer shares one source of truth.

type LoginRequest = { email: string; password: string };
type RegisterRequest = { email: string; password: string; name: string };
type AuthResponse = { user: SafeUser };
type MeResponse = {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
};

export type ArticleWithRelationsResponse = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  readTime: number;
  categoryId: string;
  sourceId: string;
  category: { id: string; name: string; slug: string; color: string };
  source: { id: string; name: string; url: string };
};

export type CreateArticleRequest = {
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  categoryId: string;
  sourceId: string;
  readTime?: number;
};

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  color: string;
  articleCount: number;
};

type SourceResponse = {
  id: string;
  name: string;
  url: string;
};

// ─── Fetch helper ────────────────────────────────────────────────────────────
// A thin wrapper around fetch that throws on non-2xx responses so TanStack
// Query treats them as errors. The thrown object carries the parsed JSON body,
// which lets components read server error messages (e.g. "Invalid email or
// password") from `error.data.error`.

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw an object that mirrors the shape RTK Query errors had,
    // so existing catch blocks (`err.data?.error`) keep working.
    throw { status: res.status, data };
  }

  return data as T;
}

// ─── Query keys ──────────────────────────────────────────────────────────────
// Centralised key factory. Every query and invalidation references these keys
// so there's no risk of typos or stale cache entries.
//
// Pattern: queryKeys.articles.all  → ["articles"]        (list)
//          queryKeys.articles.detail("art-1") → ["articles", "art-1"]
//
// When we invalidate ["articles"], TanStack Query automatically invalidates
// every key that *starts with* ["articles"], including detail keys.

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  articles: {
    all: ["articles"] as const,
    detail: (id: string) => ["articles", id] as const,
  },
  categories: ["categories"] as const,
  sources: ["sources"] as const,
};



// ─── Auth hooks ──────────────────────────────────────────────────────────────

/**
 * useGetMe – fetches the currently authenticated user.
 *
 * `retry: false` prevents hammering the server when the user is simply not
 * logged in (the endpoint returns 401).
 *
 * `staleTime: 5 min` means we won't refetch on every component mount — the
 * session doesn't change frequently.
 */
export function useGetMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api<MeResponse>("/auth/me"),
    retry: true,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * useLogin – sends credentials to POST /api/auth/login.
 *
 * On success we invalidate the "auth.me" query so the navbar and any other
 * component reading `useGetMeQuery` immediately gets the new user data.
 *
 * Returns `{ mutateAsync, isPending }`. The component calls
 * `await mutateAsync({ email, password })` and handles the result.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) =>
      api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

/**
 * useRegister – creates a new account via POST /api/auth/register.
 * Same invalidation pattern as login.
 */
export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) =>
      api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err: unknown) => {
      console.error("Registration error:", err);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

/**
 * useLogout – calls POST /api/auth/logout to clear the session cookie.
 *
 * On success we invalidate the "auth.me" cache so the UI flips back to the
 * anonymous state.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api<{ message: string }>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

// ─── Article hooks ───────────────────────────────────────────────────────────

/**
 * Shared queryFn builder for article list queries.
 * Both the public and admin hooks use the same fetch logic.
 */
function articleListQueryFn(params?: {
  category?: string;
  search?: string;
  limit?: number;
}) {
  return () => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api<ArticleWithRelationsResponse[]>(
      `/articles${qs ? `?${qs}` : ""}`
    );
  };
}

/**
 * usePublicArticlesQuery – fetches articles for public pages (homepage,
 * category pages). No auth required — the GET /api/articles endpoint is public.
 *
 * Filters are encoded into the query key so each combination is cached
 * independently. Navigating between categories hits the warm cache on revisit.
 */
export function usePublicArticlesQuery(
  params?: { category?: string; search?: string; limit?: number }
) {
  return useQuery({
    queryKey: [...queryKeys.articles.all, params ?? {}],
    queryFn: articleListQueryFn(params),
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });
}

/**
 * useGetArticlesQuery – fetches articles for admin pages.
 *
 * `enabled` is tied to the auth query: only fires once the user is
 * authenticated. This prevents unnecessary requests when the admin layout
 * hasn't finished verifying the session yet.
 */
export function useGetArticlesQuery(
  params?: { category?: string; search?: string; limit?: number }
) {
  const { data: me } = useGetMeQuery();
  const isAuthenticated = !!me?.user;

  return useQuery({
    queryKey: [...queryKeys.articles.all, params ?? {}],
    queryFn: articleListQueryFn(params),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * useGetArticle – fetches a single article by ID.
 *
 * `enabled: !!id` prevents the query from firing when id is undefined
 * (e.g. during initial render before params resolve).
 */
export function useGetArticleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () => api<ArticleWithRelationsResponse>(`/articles/${id}`),
    enabled: !!id,
  });
}

/**
 * useCreateArticle – POST /api/articles.
 *
 * On success, invalidates the entire articles cache so the admin dashboard
 * list and any public pages refetch.
 */
export function useCreateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (article: CreateArticleRequest) =>
      api<ArticleWithRelationsResponse>("/articles", {
        method: "POST",
        body: JSON.stringify(article),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * useUpdateArticle – PUT /api/articles/:id.
 *
 * Invalidates both the list cache and the specific article's detail cache
 * so both the table and the detail view show fresh data.
 */
export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateArticleRequest> }) =>
      api<ArticleWithRelationsResponse>(`/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.articles.detail(id),
      });
    },
  });
}

/**
 * useDeleteArticle – DELETE /api/articles/:id.
 *
 * Invalidates the articles list so the deleted row disappears from the table.
 */
export function useDeleteArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api<{ message: string; id: string }>(`/articles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

// ─── Reference data hooks ────────────────────────────────────────────────────
// Categories and sources rarely change, so we set a long staleTime (10 min).
// This means the dropdowns in the article form load instantly after the first
// fetch because they read from the warm cache.

export function useGetCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api<CategoryWithCount[]>("/categories"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useGetSourcesQuery() {
  return useQuery({
    queryKey: queryKeys.sources,
    queryFn: () => api<SourceResponse[]>("/sources"),
    staleTime: 10 * 60 * 1000,
  });
}
