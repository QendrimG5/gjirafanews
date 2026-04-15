// Pure utility functions — no React, no framework dependencies.

import type {
  Article,
  ArticleWithRelations,
  Category,
  Source,
} from "@gjirafanews/types";

/**
 * Joins an article with its category and source from the reference arrays.
 */
export function getArticleWithRelations(
  article: Article,
  categories: Category[],
  sources: Source[]
): ArticleWithRelations {
  const category = categories.find((c) => c.id === article.categoryId)!;
  const source = sources.find((s) => s.id === article.sourceId)!;
  return { ...article, category, source };
}

/**
 * Formats a date string as a relative time label (e.g. "5m", "3h", "2d").
 */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}days ago`;
}

/**
 * Generates sequential article IDs.
 */
export function createIdGenerator(prefix: string, startAt: number) {
  let counter = startAt;
  return () => `${prefix}${++counter}`;
}
