import Link from "next/link";
import CategoryBar from "@/components/category-bar";
import SaveButton from "@/components/save-button";
import HomePageLive from "@/components/homepage";
import NewsletterBanner from "@/components/newsletter-banner";
import { api } from "@/lib/api";
import { articleListToWithRelations, categoryFromDto } from "@/lib/data";
import { timeAgo } from "@gjirafanews/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articleDtos, categoryDtos] = await Promise.all([
    api.articles.list({ page: 1 }, { init: { next: { revalidate: 60 } } }),
    api.categories.list({ init: { next: { revalidate: 300 } } }),
  ]);

  const sortedArticles = articleDtos
    .map(articleListToWithRelations)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  const categories = categoryDtos.map(categoryFromDto);
  const featured = sortedArticles[0];

  return (
    <>
      <CategoryBar categories={categories} />
      <div className="mx-auto max-w-6xl px-5 py-6 sm:py-8">
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

        <HomePageLive username="Anonim" initialArticles={sortedArticles} />
      </div>

      <NewsletterBanner />
    </>
  );
}
