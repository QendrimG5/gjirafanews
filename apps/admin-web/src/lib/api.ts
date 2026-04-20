import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LoginRequest,
  AuthResponse,
  MeResponse,
  ArticleWithRelationsResponse,
  CreateArticleRequest,
  CategoryWithCount,
  CreateCategoryRequest,
  Category,
  SourceResponse,
} from "@gjirafanews/types";

export type { ArticleWithRelationsResponse, CreateArticleRequest } from "@gjirafanews/types";

// Fetch wrapper — uses relative URL (proxied by Vite to the Next.js backend)
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data as T;
}

// Query keys
export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  articles: {
    all: ["articles"] as const,
    detail: (id: string) => ["articles", id] as const,
  },
  categories: ["categories"] as const,
  sources: ["sources"] as const,
};

// Auth hooks
export function useGetMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api<MeResponse>("/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

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

// Article hooks
export function useGetArticlesQuery() {
  const { data: me } = useGetMeQuery();
  const isAuthenticated = !!me?.user;

  return useQuery({
    queryKey: queryKeys.articles.all,
    queryFn: () => api<ArticleWithRelationsResponse[]>("/articles"),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetArticleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () => api<ArticleWithRelationsResponse>(`/articles/${id}`),
    enabled: !!id,
  });
}

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

export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateArticleRequest>;
    }) =>
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

export function useGetCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api<CategoryWithCount[]>("/categories"),
    staleTime: 10 * 60 * 1000,
  });
}

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

export function useGetSourcesQuery() {
  return useQuery({
    queryKey: queryKeys.sources,
    queryFn: () => api<SourceResponse[]>("/sources"),
    staleTime: 10 * 60 * 1000,
  });
}
