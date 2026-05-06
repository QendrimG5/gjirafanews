import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createApiClient,
  type ArticleListDto,
  type ArticleDetailDto,
  type CategoryWithCountDto,
  type SourceDto,
  type CreateArticleRequest as CreateArticleDto,
} from "@gjirafanews/api-client";
import { slugify } from "@gjirafanews/utils";
import { getAccessToken } from "./keycloak";

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => getAccessToken(),
});

// ─── UI types — string ids for legacy components ─────────────────────────

export type ArticleFormData = {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  categoryId: string;
  sourceId: string;
  readTime: number;
};

// Match the legacy `ArticleWithRelations` shape from @gjirafanews/types so the
// shared ArticlesTable component (which still expects string ids and
// content/categoryId/sourceId fields) keeps working unchanged.
export type ArticleListItem = {
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

export type ArticleDetailItem = ArticleListItem;

function listDtoToItem(dto: ArticleListDto): ArticleListItem {
  return {
    id: String(dto.id),
    title: dto.title,
    summary: dto.summary,
    content: "",
    imageUrl: dto.imageUrl,
    publishedAt: dto.publishedAt,
    readTime: dto.readTime,
    categoryId: String(dto.category.id),
    sourceId: String(dto.source.id),
    category: {
      id: String(dto.category.id),
      name: dto.category.name,
      slug: dto.category.slug,
      color: dto.category.color,
    },
    source: {
      id: String(dto.source.id),
      name: dto.source.name,
      url: dto.source.url,
    },
  };
}

function detailDtoToItem(dto: ArticleDetailDto): ArticleDetailItem {
  return {
    ...listDtoToItem(dto),
    content: dto.content,
  };
}

function categoryDtoToWithCount(dto: CategoryWithCountDto) {
  return {
    id: String(dto.id),
    name: dto.name,
    slug: dto.slug,
    color: dto.color,
    articleCount: dto.articleCount,
  };
}

function sourceDtoToItem(dto: SourceDto) {
  return {
    id: String(dto.id),
    name: dto.name,
    url: dto.url,
  };
}

// ─── Query keys ──────────────────────────────────────────────────────────

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
    queryFn: () => apiClient.users.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetArticlesQuery() {
  return useQuery({
    queryKey: queryKeys.articles.all,
    queryFn: async () => {
      const dtos = await apiClient.articles.list({ page: 1 });
      return dtos.map(listDtoToItem);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetArticleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: async () => detailDtoToItem(await apiClient.articles.get(Number(id))),
    enabled: !!id && Number.isFinite(Number(id)),
  });
}

function formToCreateDto(data: ArticleFormData): CreateArticleDto {
  return {
    title: data.title,
    summary: data.summary,
    content: data.content,
    imageUrl: data.imageUrl || undefined,
    categoryId: Number(data.categoryId),
    sourceId: Number(data.sourceId),
    readTime: data.readTime,
  };
}

export function useCreateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ArticleFormData) =>
      apiClient.articles.create(formToCreateDto(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArticleFormData }) =>
      apiClient.articles.update(Number(id), formToCreateDto(data)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(id) });
    },
  });
}

export function useDeleteArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.articles.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

export function useGetCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const dtos = await apiClient.categories.list();
      return dtos.map(categoryDtoToWithCount);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export type CreateCategoryFormData = { name: string; color: string; slug?: string };

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryFormData) =>
      apiClient.categories.create({
        name: data.name,
        slug: data.slug || slugify(data.name),
        color: data.color,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.categories.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useGetSourcesQuery() {
  return useQuery({
    queryKey: queryKeys.sources,
    queryFn: async () => {
      const dtos = await apiClient.sources.list();
      return dtos.map(sourceDtoToItem);
    },
    staleTime: 10 * 60 * 1000,
  });
}
