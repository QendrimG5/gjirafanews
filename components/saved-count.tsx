"use client";

import Link from "next/link";
import { useSavedArticles } from "@/lib/store/saved-articles";

export default function SavedCount() {
  const count = useSavedArticles((s) => s.savedIds.length);

  return (
    <Link
      href="/saved"
      className="relative text-gn-text-secondary hover:text-gn-text transition-colors"
      aria-label={`${count} artikuj te ruajtur`}
    >
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full bg-gn-accent text-gn-text-inverse text-[9px] font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
