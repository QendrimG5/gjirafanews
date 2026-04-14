import type { Metadata } from "next";
import Link from "next/link";
import { categories, articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Temat",
  description:
    "Zgjidhni temat qe ju interesojne per te ndjekur lajmet ne GjirafaNews.",
  openGraph: {
    title: "Temat | GjirafaNews",
    description:
      "Zgjidhni temat qe ju interesojne per te ndjekur lajmet ne GjirafaNews.",
  },
};

export default function TopicsPage() {
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    articleCount: articles.filter((a) => a.categoryId === cat.id).length,
  }));

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-gn-text tracking-tight">Temat</h1>
      <p className="text-gn-text-secondary mt-1 mb-8 text-sm">
        Zgjidhni temat qe ju interesojne per te ndjekur lajmet.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categoriesWithCount.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="relative overflow-hidden rounded-2xl bg-gn-surface border border-gn-border-light p-5 hover:border-gn-border hover:shadow-lg hover:shadow-gn-overlay transition-all group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: cat.color + "15" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <h3 className="font-semibold text-gn-text text-[15px]">{cat.name}</h3>
            <p className="text-xs text-gn-text-tertiary mt-1">
              {cat.articleCount} artikuj
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
