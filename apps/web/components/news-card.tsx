import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@gjirafanews/utils";
import SaveButton from "@/components/save-button";

type NewsCardProps = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  publishedAt: string;
  readTime: number;
  category: { name: string; slug: string; color: string };
  source: { name: string };
};

export default function NewsCard({
  id,
  title,
  summary,
  imageUrl,
  publishedAt,
  readTime,
  category,
  source,
}: NewsCardProps) {
  return (
    <Link
      href={`/article/${id}`}
      className="group block"
      aria-label={`${title} — ${source.name}, ${timeAgo(publishedAt)}, ${readTime} min lexim`}
    >
      <article aria-labelledby={`card-title-${id}`}>
        <div className="bg-gn-surface hover:shadow-gn-overlay border-gn-border-light hover:border-gn-border overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg">
          <div className="bg-gn-overlay relative aspect-video overflow-hidden">
            <Image
              src={imageUrl}
              alt=""
              role="presentation"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.10]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
              aria-hidden="true"
            />
            <span
              className="text-gn-text-inverse bg-gn-primary/70 absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
              aria-hidden="true"
            >
              {category.name}
            </span>
            <span className="absolute top-3 right-3">
              <SaveButton articleId={id} />
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <h3
              id={`card-title-${id}`}
              className="text-gn-text group-hover:text-gn-accent line-clamp-2 text-[15px] leading-snug font-semibold transition-colors sm:text-base"
            >
              {title}
            </h3>
            <p className="text-gn-text-secondary mt-2 line-clamp-2 text-[13px] leading-relaxed">
              {summary}
            </p>
            <div
              className="text-gn-text-tertiary mt-3 flex items-center gap-1.5 text-[12px]"
              aria-hidden="true"
            >
              <span className="text-gn-text-secondary font-medium">
                {source.name}
              </span>
              <span className="text-gn-border">|</span>
              <span>{timeAgo(publishedAt)}</span>
              <span className="text-gn-border">|</span>
              <span>{readTime} min</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
