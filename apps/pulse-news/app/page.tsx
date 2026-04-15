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
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .map(getArticleWithRelations);

  const featured = sortedArticles[0];
  const rest = sortedArticles.slice(1);

  return (
    <>
      <CategoryBar categories={categories} />
      <div className="mx-auto max-w-6xl px-5 py-6 sm:py-8">
        {/* Hero — featured article with large image */}
        {featured && (
          <Link href={`/article/${featured.id}`} className="group mb-10 block">
            <article className="bg-gn-overlay relative aspect-[16/9] overflow-hidden rounded-2xl sm:aspect-[21/9]">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-4 right-4">
                <SaveButton articleId={featured.id} />
              </div>
              <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-8">
                <span className="text-gn-text-inverse mb-3 inline-block rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                  {featured.category.name}
                </span>
                <h1 className="max-w-3xl text-xl leading-tight font-bold text-white sm:text-3xl lg:text-4xl">
                  {featured.title}
                </h1>
                <p className="mt-2 line-clamp-2 hidden max-w-2xl text-sm text-white/80 sm:block sm:text-base">
                  {featured.summary}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-white/60 sm:text-sm">
                  <span className="font-medium text-white/80">
                    {featured.source.name}
                  </span>
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
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-gn-text text-sm font-semibold tracking-wider uppercase">
            Me te rejat
          </h2>
          <div className="bg-gn-border-light h-px flex-1" />
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <NewsCard key={article.id} {...article} />
          ))}
        </div>
      </div>
    </>
  );
}
