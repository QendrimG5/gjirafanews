import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { articles, categories, sources, getArticleWithRelations } from "@/lib/data";
import SaveButton from "@/components/save-button";
import TrackEvent from "@/components/track-event";

function getArticle(id: string) {
  const raw = articles.find((a) => a.id === id);
  if (!raw) return null;
  return getArticleWithRelations(raw);
}

function getRelated(categorySlug: string, excludeId: string) {
  return articles
    .filter((a) => {
      const cat = categories.find((c) => c.id === a.categoryId);
      return cat?.slug === categorySlug && a.id !== excludeId;
    })
    .slice(0, 3)
    .map(getArticleWithRelations);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = getArticle(id);

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
  const article = getArticle(id);

  if (!article) notFound();

  const relatedArticles = getRelated(article.category.slug, article.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: [
      article.imageUrl,
    ],
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
      <article className="max-w-2xl mx-auto px-5 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gn-text-tertiary mb-6">
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

        {/* Category + Save */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-gn-text-inverse bg-gn-primary">
            {article.category.name}
          </span>
          <SaveButton articleId={article.id} />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-bold text-gn-text leading-[1.2] tracking-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-4 text-sm text-gn-text-tertiary">
          <span className="font-medium text-gn-text-secondary">
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

        {/* Image */}
        <div className="mt-8 rounded-2xl overflow-hidden aspect-video bg-gn-overlay relative">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            priority
            className="object-cover"
          />
        </div>

        {/* Summary */}
        <p className="mt-8 text-lg text-gn-text-secondary font-medium leading-relaxed border-l-2 border-gn-accent pl-5">
          {article.summary}
        </p>

        {/* Content */}
        <div className="mt-6 text-[17px] text-gn-text leading-[1.8] whitespace-pre-line">
          {article.content}
        </div>

        {/* Source */}
        <div className="mt-10 pt-6 border-t border-gn-border-light">
          <p className="text-sm text-gn-text-tertiary">
            Burimi:{" "}
            <span className="font-medium text-gn-text-secondary">
              {article.source.name}
            </span>
          </p>
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-semibold text-gn-text uppercase tracking-wider">
                Te ngjashme
              </h2>
              <div className="flex-1 h-px bg-gn-border-light" />
            </div>
            <div className="grid gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/article/${rel.id}`}
                  className="flex gap-4 p-3 rounded-xl hover:bg-gn-overlay transition-colors group"
                >
                  <div className="w-20 h-14 sm:w-28 sm:h-18 rounded-lg overflow-hidden shrink-0 bg-gn-overlay relative">
                    <Image
                      src={rel.imageUrl}
                      alt={rel.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-gn-text group-hover:text-gn-accent transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-gn-text-tertiary mt-1">
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
