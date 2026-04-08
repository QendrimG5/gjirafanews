import Link from "next/link";
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
    <Link href={`/article/${id}`} className="group block">
      <article className="bg-gn-surface rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 border border-gn-border-light hover:border-gn-border">
        <div className="relative aspect-[16/9] overflow-hidden bg-gn-overlay">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold text-gn-text-inverse bg-gn-primary/70 backdrop-blur-sm">
            {category.name}
          </span>
          <span className="absolute top-3 right-3">
            <SaveButton articleId={id} />
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="text-[15px] sm:text-base font-semibold text-gn-text leading-snug group-hover:text-gn-accent transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="mt-2 text-[13px] text-gn-text-secondary leading-relaxed line-clamp-2">
            {summary}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] text-gn-text-tertiary">
            <span className="font-medium text-gn-text-secondary">{source.name}</span>
            <span className="text-gn-border">|</span>
            <span>{timeAgo(publishedAt)}</span>
            <span className="text-gn-border dark:text-green-700!">|</span>
            <span>{readTime} min</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
