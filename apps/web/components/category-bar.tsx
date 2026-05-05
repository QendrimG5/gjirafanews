"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export default function CategoryBar({
  categories,
}: {
  categories: Category[];
}) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : null;

  return (
    <div className="bg-gn-surface/80 border-gn-border-light sticky top-16 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto max-w-6xl">
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto px-5 py-2.5">
          <Link
            href="/"
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
              !activeSlug
                ? "bg-gn-primary text-gn-text-inverse"
                : "text-gn-text-secondary hover:bg-gn-overlay hover:text-gn-text"
            }`}
          >
            Te gjitha
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                activeSlug === cat.slug
                  ? "bg-gn-primary text-gn-text-inverse"
                  : "text-gn-text-secondary hover:bg-gn-overlay hover:text-gn-text"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
