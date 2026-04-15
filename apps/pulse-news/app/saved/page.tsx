"use client";

import Link from "next/link";
import NewsCard from "@/components/news-card";
import { useSavedArticles } from "@/lib/store/saved-articles";
import { usePublicArticlesQuery } from "@/lib/store/api";

export default function SavedPage() {
  const { savedIds } = useSavedArticles();
  const { data: allArticles, isLoading } = usePublicArticlesQuery();

  const savedArticles =
    allArticles?.filter((a) => savedIds.includes(a.id)) ?? [];

  if (isLoading) {
    return (
      <div className="text-gn-text-tertiary mx-auto max-w-5xl px-5 py-16 text-center">
        Duke ngarkuar...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-gn-text text-2xl font-bold tracking-tight">
        Te ruajtura
      </h1>
      <p className="text-gn-text-secondary mt-1 mb-8 text-sm">
        {savedArticles.length > 0
          ? `${savedArticles.length} artikuj te ruajtur`
          : "Nuk keni artikuj te ruajtur."}
      </p>

      {savedArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedArticles.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <svg
            className="text-gn-border mx-auto mb-4 h-12 w-12"
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
          <p className="text-gn-text-tertiary mb-4 text-sm">
            Shtypni ikonen e ruajtjes ne artikuj per ti ruajtur ketu.
          </p>
          <Link
            href="/"
            className="bg-gn-primary text-gn-text-inverse inline-flex rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          >
            Shfletoni lajmet
          </Link>
        </div>
      )}
    </div>
  );
}
