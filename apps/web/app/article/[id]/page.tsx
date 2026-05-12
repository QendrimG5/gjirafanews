import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import {
  articleDetailToWithRelations,
  articleListToWithRelations,
} from "@/lib/data";
import SaveButton from "@/components/save-button";
import TrackEvent from "@/components/track-event";
import { ApiError } from "@gjirafanews/api-client";

async function fetchArticle(id: string) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;
  try {
    const dto = await api.articles.get(numericId);
    return articleDetailToWithRelations(dto);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function fetchRelated(categorySlug: string, excludeId: string) {
  const all = await api.articles.list({ page: 1 });
  return all
    .map(articleListToWithRelations)
    .filter((a) => a.category.slug === categorySlug && a.id !== excludeId)
    .slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticle(id);

  if (!article) {
    return { title: "Artikulli nuk u gjet" };
  }

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      images: [{ url: article.imageUrl, width: 800, height: 400 }],
      publishedTime: article.publishedAt,
      section: article.category.name,
      authors: [article.source.name],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [article.imageUrl],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await fetchArticle(id);

  if (!article) notFound();

  const relatedArticles = await fetchRelated(article.category.slug, article.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: [article.imageUrl],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: [
      {
        "@type": "Organization",
        name: article.source.name,
        url: article.source.url,
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "GjirafaNews",
      url: "https://gjirafanews.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://gjirafanews.com/article/${article.id}`,
    },
    articleSection: article.category.name,
  };

  return (
    <>
      <TrackEvent
        event="view_article"
        params={{
          article_id: article.id,
          article_title: article.title,
          category_name: article.category.name,
          source_name: article.source.name,
          read_time: article.readTime,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-2xl px-5 py-8">
        <nav className="text-gn-text-tertiary mb-6 flex items-center gap-2 text-xs">
          <Link href="/" className="hover:text-gn-text transition-colors">
            Ballina
          </Link>
          <span>/</span>
          <Link
            href={`/category/${article.category.slug}`}
            className="hover:text-gn-text transition-colors"
          >
            {article.category.name}
          </Link>
        </nav>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-gn-text-inverse bg-gn-primary rounded-full px-3 py-1 text-[11px] font-semibold">
            {article.category.name}
          </span>
          <SaveButton articleId={article.id} />
        </div>

        <h1 className="text-gn-text text-2xl leading-[1.2] font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>

        <div className="text-gn-text-tertiary mt-4 flex items-center gap-3 text-sm">
          <span className="text-gn-text-secondary font-medium">
            {article.source.name}
          </span>
          <span>·</span>
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleDateString("sq-AL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{article.readTime} min lexim</span>
        </div>

        <div className="bg-gn-overlay relative mt-8 aspect-video overflow-hidden rounded-2xl">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            priority
            className="object-cover"
          />
        </div>

        <p className="text-gn-text-secondary border-gn-accent mt-8 border-l-2 pl-5 text-lg leading-relaxed font-medium">
          {article.summary}
        </p>

        <div className="text-gn-text mt-6 text-[17px] leading-[1.8] whitespace-pre-line">
          {article.content}
        </div>

        <div className="border-gn-border-light mt-10 border-t pt-6">
          <p className="text-gn-text-tertiary text-sm">
            Burimi:{" "}
            <span className="text-gn-text-secondary font-medium">
              {article.source.name}
            </span>
          </p>
        </div>

        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-gn-text text-sm font-semibold tracking-wider uppercase">
                Te ngjashme
              </h2>
              <div className="bg-gn-border-light h-px flex-1" />
            </div>
            <div className="grid gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/article/${rel.id}`}
                  className="hover:bg-gn-overlay group flex gap-4 rounded-xl p-3 transition-colors"
                >
                  <div className="bg-gn-overlay relative h-14 w-20 shrink-0 overflow-hidden rounded-lg sm:h-18 sm:w-28">
                    <Image
                      src={rel.imageUrl}
                      alt={rel.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-center">
                    <h3 className="text-gn-text group-hover:text-gn-accent line-clamp-2 text-sm font-semibold transition-colors">
                      {rel.title}
                    </h3>
                    <p className="text-gn-text-tertiary mt-1 text-xs">
                      {rel.source.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
