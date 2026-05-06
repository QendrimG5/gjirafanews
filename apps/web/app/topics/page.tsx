import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";

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

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const categories = await api.categories.list();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-gn-text text-2xl font-bold tracking-tight">Temat</h1>
      <p className="text-gn-text-secondary mt-1 mb-8 text-sm">
        Zgjidhni temat qe ju interesojne per te ndjekur lajmet.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="bg-gn-surface border-gn-border-light hover:border-gn-border hover:shadow-gn-overlay group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-lg"
          >
            <div
              className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: cat.color + "15" }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <h3 className="text-gn-text text-[15px] font-semibold">
              {cat.name}
            </h3>
            <p className="text-gn-text-tertiary mt-1 text-xs">
              {cat.articleCount} artikuj
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
