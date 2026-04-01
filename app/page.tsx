import Link from "next/link";
import NewsCard from "@/components/news-card";
import CategoryBar from "@/components/category-bar";
import SaveButton from "@/components/save-button";
import { articles, categories, getArticleWithRelations } from "@/lib/data";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function Home() {
  const sortedArticles = [...articles]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .map(getArticleWithRelations);

  const featured = sortedArticles[0];
  const rest = sortedArticles.slice(1);

  return (
    <>
      <CategoryBar categories={categories} />
      <div className="max-w-6xl mx-auto px-5 py-6 sm:py-8">
        {/* Hero — featured article with large image */}
        {featured && (
          <Link href={`/article/${featured.id}`} className="group block mb-10">
            <article className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-gn-overlay">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-4 right-4">
                <SaveButton articleId={featured.id} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold text-gn-text-inverse bg-white/20 backdrop-blur-sm mb-3">
                  {featured.category.name}
                </span>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
                  {featured.title}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-white/80 max-w-2xl line-clamp-2 hidden sm:block">
                  {featured.summary}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-white/60">
                  <span className="font-medium text-white/80">{featured.source.name}</span>
                  <span>·</span>
                  <span>{timeAgo(featured.publishedAt)}</span>
                  <span>·</span>
                  <span>{featured.readTime} min lexim</span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-sm font-semibold text-gn-text uppercase tracking-wider">
            Me te rejat
          </h2>
          <div className="flex-1 h-px bg-gn-border-light" />
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </>
  );
}
