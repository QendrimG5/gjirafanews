import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  articleListToWithRelations,
  articleDetailToWithRelations,
  categoryFromDto,
  sourceFromDto,
} from "@/lib/data";
import type { ArticleWithRelations, Category, Source } from "@gjirafanews/types";

// Centralized React Query keys. Mutations land via the api-client directly
// in the components that need them (admin lives in apps/admin).
export const queryKeys = {
  articles: {
    all: ["articles"] as const,
    detail: (id: string) => ["articles", id] as const,
  },
  categories: ["categories"] as const,
  sources: ["sources"] as const,
};

export type CategoryWithCount = Category & { articleCount: number };

export function usePublicArticlesQuery(
  params?: { category?: string; search?: string; limit?: number },
) {
  return useQuery({
    queryKey: [...queryKeys.articles.all, params ?? {}],
    queryFn: async (): Promise<ArticleWithRelations[]> => {
      const dtos = await api.articles.list({ page: 1 });
      let mapped = dtos.map(articleListToWithRelations);
      if (params?.category) {
        mapped = mapped.filter((a) => a.category.slug === params.category);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        mapped = mapped.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.summary.toLowerCase().includes(q),
        );
      }
      if (params?.limit) mapped = mapped.slice(0, params.limit);
      return mapped;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetArticleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: async (): Promise<ArticleWithRelations> => {
      const dto = await api.articles.get(Number(id));
      return articleDetailToWithRelations(dto);
    },
    enabled: !!id && Number.isFinite(Number(id)),
  });
}

export function useGetCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const dtos = await api.categories.list();
      return dtos.map((c) => ({
        ...categoryFromDto(c),
        articleCount: c.articleCount,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useGetSourcesQuery() {
  return useQuery({
    queryKey: queryKeys.sources,
    queryFn: async (): Promise<Source[]> => {
      const dtos = await api.sources.list();
      return dtos.map(sourceFromDto);
    },
    staleTime: 10 * 60 * 1000,
  });
}
