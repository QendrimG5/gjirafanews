import Link from "next/link";

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
  if (diffMins < 60) return `${diffMins} min më parë`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} orë më parë`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ditë më parë`;
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
      <article className="bg-white rounded-xl border border-gn-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[2/1] overflow-hidden bg-gn-gray-100">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gn-gray-900 leading-snug group-hover:text-gn-green transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gn-gray-500 line-clamp-2">{summary}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gn-gray-500">
            <span className="font-medium text-gn-gray-700">{source.name}</span>
            <span>·</span>
            <span>{timeAgo(publishedAt)}</span>
            <span>·</span>
            <span>{readTime} min lexim</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
