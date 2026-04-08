"use client";

import { useEffect, useState } from "react";
import { useSavedArticles } from "@/lib/store/saved-articles";

export default function SaveButton({ articleId }: { articleId: string }) {
  const { toggle, isSaved } = useSavedArticles();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const saved = hydrated && isSaved(articleId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(articleId);
      }}
      aria-label={saved ? "Hiq nga te ruajtura" : "Ruaj per me vone"}
      className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${
        saved
          ? "bg-gn-accent text-gn-text-inverse"
          : "bg-black/20 text-white hover:bg-black/40"
      }`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
