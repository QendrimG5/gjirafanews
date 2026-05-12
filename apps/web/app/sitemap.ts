import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const BASE_URL = "https://gjirafanews.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    api.articles.list({ page: 1 }).catch(() => []),
    api.categories.list().catch(() => []),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/article/${article.id}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/topics`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...categoryEntries,
    ...articleEntries,
  ];
}
