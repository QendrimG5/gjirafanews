import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsCard from "@/components/news-card";
import CategoryBar from "@/components/category-bar";
import { articles, categories, getArticleWithRelations } from "@/lib/data";
import TrackEvent from "@/components/track-event";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: "Kategoria nuk u gjet" };
  }

  return {
    title: category.name,
    description: `Lajmet me te reja per ${category.name} ne GjirafaNews.`,
    openGraph: {
      title: `${category.name} | GjirafaNews`,
      description: `Lajmet me te reja per ${category.name} ne GjirafaNews.`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);

  if (!category) notFound();

  const categoryArticles = articles
    .filter((a) => a.categoryId === category.id)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .map(getArticleWithRelations);

  return (
    <>
      <TrackEvent
        event="view_category"
        params={{
          category_name: category.name,
          category_slug: category.slug,
          article_count: categoryArticles.length,
        }}
      />
      <CategoryBar categories={categories} />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gn-text tracking-tight">
            {category.name}
          </h1>
          <p className="text-sm text-gn-text-tertiary mt-1">
            {categoryArticles.length} artikuj
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryArticles.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </>
  );
}
