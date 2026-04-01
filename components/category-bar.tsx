"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export default function CategoryBar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/category/") ? pathname.split("/")[2] : null;

  return (
    <div className="sticky top-16 z-40 bg-gn-surface/80 backdrop-blur-xl border-b border-gn-border-light">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-1.5 px-5 py-2.5 overflow-x-auto hide-scrollbar">
          <Link
            href="/"
            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
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
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
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
