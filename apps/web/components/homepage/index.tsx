"use client";

import type { ArticleWithRelations } from "@gjirafanews/types";
import { HomePageProvider } from "./homepage-context";
import { LiveArticleGrid } from "./live-article-grid";
import { LiveChat } from "./live-chat";

export default function HomePageLive({
  username,
  initialArticles,
}: {
  username: string;
  initialArticles: ArticleWithRelations[];
}) {
  return (
    <HomePageProvider username={username} initialArticles={initialArticles}>
      {/* Section label */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-gn-text text-sm font-semibold tracking-wider uppercase">
          Me te rejat
        </h2>
        <div className="bg-gn-border-light h-px flex-1" />
      </div>

      <LiveArticleGrid />

      {/* Live Chat */}
      <div className="mb-5 mt-10 flex items-center gap-3">
        <h2 className="text-gn-text text-sm font-semibold tracking-wider uppercase">
          Live Chat
        </h2>
        <div className="bg-gn-border-light h-px flex-1" />
      </div>
      <div className="mb-8">
        <LiveChat />
      </div>
    </HomePageProvider>
  );
}
