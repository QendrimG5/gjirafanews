"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import NewsCard from "@/components/news-card";
import CategoryBar from "@/components/category-bar";
import {
  usePublicArticlesQuery,
  useGetCategoriesQuery,
} from "@/lib/store/api";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: articles, isLoading: loadingArticles } = usePublicArticlesQuery({ category: slug });
  const { data: categories, isLoading: loadingCategories } = useGetCategoriesQuery();

  const category = categories?.find((c) => c.slug === slug);

  if (loadingArticles || loadingCategories) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-16 text-center text-gn-text-tertiary">
        Duke ngarkuar artikujt...
      </div>
    );
  }

  if (!category) notFound();

  return (
    <>
      <CategoryBar categories={categories!} />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gn-text tracking-tight">
            {category.name}
          </h1>
          <p className="text-sm text-gn-text-tertiary mt-1">
            {articles?.length ?? 0} artikuj
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles?.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </>
  );
}
