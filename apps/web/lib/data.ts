// Transformation helpers between the .NET API wire format and the
// `ArticleWithRelations` shape this app's UI components expect.
//
// The legacy in-memory mock arrays were removed once the .NET API became the
// source of truth (see docs/architecture-changes.md). The slugify helper
// moved to @gjirafanews/utils.

import type { ArticleWithRelations, Category, Source } from "@gjirafanews/types";
import type {
  ArticleListDto,
  ArticleDetailDto,
  CategoryDto,
  CategoryWithCountDto,
  SourceDto,
} from "@gjirafanews/api-client";
export { slugify } from "@gjirafanews/utils";

export type { Article, Category, Source, User, ArticleWithRelations } from "@gjirafanews/types";
export type { SafeUser, UserRole } from "@gjirafanews/types";

export function categoryFromDto(dto: CategoryDto | CategoryWithCountDto): Category {
  return {
    id: String(dto.id),
    name: dto.name,
    slug: dto.slug,
    color: dto.color,
  };
}

export function sourceFromDto(dto: SourceDto): Source {
  return {
    id: String(dto.id),
    name: dto.name,
    url: dto.url,
  };
}

/**
 * Maps an API list DTO to the UI `ArticleWithRelations` shape.
 * `content` is empty in list responses; use {@link articleDetailToWithRelations}
 * for the full article body.
 */
export function articleListToWithRelations(dto: ArticleListDto): ArticleWithRelations {
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
    category: categoryFromDto(dto.category),
    source: sourceFromDto(dto.source),
  };
}

export function articleDetailToWithRelations(
  dto: ArticleDetailDto,
): ArticleWithRelations {
  return {
    ...articleListToWithRelations(dto),
    content: dto.content,
  };
}
