"use client";

import NewsCard from "@/components/news-card";
import { useHomePageContext } from "./homepage-context";

export function LiveArticleGrid() {
  const { liveArticles } = useHomePageContext();

  // Skip first article (featured) — show the rest
  const rest = liveArticles.slice(1);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rest.map((article) => (
        <NewsCard key={article.id} {...article} />
      ))}
    </div>
  );
}
