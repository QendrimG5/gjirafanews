import { notFound } from "next/navigation";
import Link from "next/link";
import type { ArticleWithRelations } from "@/lib/data";

async function getArticle(id: string): Promise<ArticleWithRelations | null> {
  const res = await fetch(`http://localhost:3000/api/articles/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getRelatedArticles(categorySlug: string): Promise<ArticleWithRelations[]> {
  const res = await fetch(
    `http://localhost:3000/api/articles?category=${categorySlug}&limit=4`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  const related = await getRelatedArticles(article.category.slug);
  const relatedArticles = related.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <article className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gn-gray-500 mb-4">
        <Link href="/" className="hover:text-gn-green transition-colors">
          Ballina
        </Link>
        <span>/</span>
        <Link
          href={`/category/${article.category.slug}`}
          className="hover:text-gn-green transition-colors"
        >
          {article.category.name}
        </Link>
      </nav>

      {/* Category badge */}
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4"
        style={{ backgroundColor: article.category.color }}
      >
        {article.category.name}
      </span>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gn-gray-900 leading-tight">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-3 mt-4 text-sm text-gn-gray-500">
        <span className="font-medium text-gn-gray-700">{article.source.name}</span>
        <span>·</span>
        <time>
          {new Date(article.publishedAt).toLocaleDateString("sq-AL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        <span>·</span>
        <span>{article.readTime} min lexim</span>
      </div>

      {/* Image */}
      <div className="mt-6 rounded-xl overflow-hidden aspect-[2/1] bg-gn-gray-100">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Summary */}
      <p className="mt-6 text-lg text-gn-gray-700 font-medium leading-relaxed border-l-4 border-gn-green pl-4">
        {article.summary}
      </p>

      {/* Content */}
      <div className="mt-6 text-base text-gn-gray-700 leading-relaxed whitespace-pre-line">
        {article.content}
      </div>

      {/* Source */}
      <div className="mt-8 pt-6 border-t border-gn-gray-200">
        <p className="text-sm text-gn-gray-500">
          Burimi:{" "}
          <span className="font-medium text-gn-gray-700">{article.source.name}</span>
        </p>
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gn-gray-900 mb-4">
            Lajme të ngjashme
          </h2>
          <div className="grid gap-4">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/article/${related.id}`}
                className="flex gap-4 p-3 rounded-lg border border-gn-gray-200 hover:border-gn-green transition-colors group"
              >
                <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-gn-gray-100">
                  <img
                    src={related.imageUrl}
                    alt={related.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gn-gray-900 group-hover:text-gn-green transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gn-gray-500 mt-1">
                    {related.source.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
