import NewsCard from "@/components/news-card";
import CategoryBar from "@/components/category-bar";
import type { ArticleWithRelations } from "@/lib/data";

async function getArticles(): Promise<ArticleWithRelations[]> {
  const res = await fetch("http://localhost:3000/api/articles", {
    cache: "no-store",
  });
  return res.json();
}

async function getCategories() {
  const res = await fetch("http://localhost:3000/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

export default async function Home() {
  const [articles, categories] = await Promise.all([
    getArticles(),
    getCategories(),
  ]);

  return (
    <>
      <CategoryBar categories={categories} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Featured article */}
        {articles[0] && (
          <section className="mb-8">
            <NewsCard {...articles[0]} />
          </section>
        )}

        {/* Article grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.slice(1).map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </>
  );
}
