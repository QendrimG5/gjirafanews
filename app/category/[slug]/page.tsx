import { notFound } from "next/navigation";
import NewsCard from "@/components/news-card";
import CategoryBar from "@/components/category-bar";
import type { ArticleWithRelations } from "@/lib/data";

async function getArticlesByCategory(slug: string): Promise<ArticleWithRelations[]> {
  const res = await fetch(
    `http://localhost:3000/api/articles?category=${slug}`,
    { cache: "no-store" }
  );
  return res.json();
}

async function getCategories() {
  const res = await fetch("http://localhost:3000/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [articles, categories] = await Promise.all([
    getArticlesByCategory(slug),
    getCategories(),
  ]);

  const category = categories.find(
    (c: { slug: string }) => c.slug === slug
  );
  if (!category) notFound();

  return (
    <>
      <CategoryBar categories={categories} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gn-gray-900">
            {category.name}
          </h1>
          <p className="text-sm text-gn-gray-500 mt-1">
            {articles.length} artikuj
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article: ArticleWithRelations) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </>
  );
}
