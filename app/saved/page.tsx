"use client";

import Link from "next/link";
import NewsCard from "@/components/news-card";
import { useSavedArticles } from "@/lib/store/saved-articles";
import { usePublicArticlesQuery } from "@/lib/store/api";

export default function SavedPage() {
  const { savedIds } = useSavedArticles();
  const { data: allArticles, isLoading } = usePublicArticlesQuery();

  const savedArticles = allArticles?.filter((a) => savedIds.includes(a.id)) ?? [];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-16 text-center text-gn-text-tertiary">
        Duke ngarkuar...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-gn-text tracking-tight">
        Te ruajtura
      </h1>
      <p className="text-gn-text-secondary mt-1 mb-8 text-sm">
        {savedArticles.length > 0
          ? `${savedArticles.length} artikuj te ruajtur`
          : "Nuk keni artikuj te ruajtur."}
      </p>

      {savedArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedArticles.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 mx-auto text-gn-border mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="text-gn-text-tertiary text-sm mb-4">
            Shtypni ikonen e ruajtjes ne artikuj per ti ruajtur ketu.
          </p>
          <Link
            href="/"
            className="inline-flex px-4 py-2 rounded-full bg-gn-primary text-gn-text-inverse text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Shfletoni lajmet
          </Link>
        </div>
      )}
    </div>
  );
}
