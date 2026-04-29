import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ArticleWithRelationsResponse,
  CreateArticleRequest,
  CategoryWithCount,
  CreateCategoryRequest,
  Category,
  SourceResponse,
} from "@gjirafanews/types";
import { getAccessToken } from "./keycloak";

export type {
  ArticleWithRelationsResponse,
  CreateArticleRequest,
} from "@gjirafanews/types";

const AUTH_API_URL = import.meta.env.VITE_API_URL;
const CONTENT_API_URL = import.meta.env.VITE_CONTENT_API_URL;

// Shape returned by the .NET ApiResponse<T> envelope
type NetApiResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
};

async function authorizedFetch<T>(
  base: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data as T;
}

// apiAuth → .NET API (http://localhost:5283). Used for /users and auth-related endpoints.
function apiAuth<T>(path: string, options?: RequestInit): Promise<T> {
  return authorizedFetch<T>(AUTH_API_URL, path, options);
}

// apiContent → Next.js API (http://localhost:3000/api). Used for articles/categories/sources
// until those endpoints are migrated to .NET.
function apiContent<T>(path: string, options?: RequestInit): Promise<T> {
  return authorizedFetch<T>(CONTENT_API_URL, path, options);
}

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  articles: {
    all: ["articles"] as const,
    detail: (id: string) => ["articles", id] as const,
  },
  categories: ["categories"] as const,
  sources: ["sources"] as const,
};

export type CurrentUser = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
};

export function useGetMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const res = await apiAuth<NetApiResponse<CurrentUser>>("/users/me");
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Article hooks
export function useGetArticlesQuery() {
  return useQuery({
    queryKey: queryKeys.articles.all,
    queryFn: () => apiContent<ArticleWithRelationsResponse[]>("/articles"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetArticleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () =>
      apiContent<ArticleWithRelationsResponse>(`/articles/${id}`),
    enabled: !!id,
  });
}

export function useCreateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (article: CreateArticleRequest) =>
      apiContent<ArticleWithRelationsResponse>("/articles", {
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
      apiContent<ArticleWithRelationsResponse>(`/articles/${id}`, {
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
      apiContent<{ message: string; id: string }>(`/articles/${id}`, {
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
    queryFn: () => apiContent<CategoryWithCount[]>("/categories"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) =>
      apiContent<Category>("/categories", {
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
      apiContent<{ message: string; id: string }>(`/categories/${id}`, {
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
    queryFn: () => apiContent<SourceResponse[]>("/sources"),
    staleTime: 10 * 60 * 1000,
  });
}
