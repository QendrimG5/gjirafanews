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

const RTF = new Intl.RelativeTimeFormat("sq-AL", { numeric: "auto" });

const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

/**
 * Formats a date as Albanian relative time (e.g. "5 minuta më parë", "para 3 orësh").
 * Uses Intl.RelativeTimeFormat — proper localization, no missing-space bugs.
 *
 * @param date  Date | ISO string | epoch millis
 * @param now   Reference time for testability; defaults to current time.
 */
export function timeAgo(date: Date | string | number, now: Date = new Date()): string {
  const target = date instanceof Date ? date : new Date(date);
  const diffSec = Math.round((target.getTime() - now.getTime()) / 1000);
  for (const [unit, seconds] of TIME_UNITS) {
    if (Math.abs(diffSec) >= seconds || unit === "second") {
      return RTF.format(Math.round(diffSec / seconds), unit);
    }
  }
  return RTF.format(0, "second");
}

/**
 * Generates sequential article IDs.
 */
export function createIdGenerator(prefix: string, startAt: number) {
  let counter = startAt;
  return () => `${prefix}${++counter}`;
}

export { slugify } from "./slugify";
