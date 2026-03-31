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
    <div className="sticky top-14 z-40 bg-white border-b border-gn-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
          <Link
            href="/"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeSlug
                ? "bg-gn-green text-white"
                : "bg-gn-gray-100 text-gn-gray-700 hover:bg-gn-gray-200"
            }`}
          >
            Të gjitha
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeSlug === cat.slug
                  ? "text-white"
                  : "bg-gn-gray-100 text-gn-gray-700 hover:bg-gn-gray-200"
              }`}
              style={activeSlug === cat.slug ? { backgroundColor: cat.color } : undefined}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
