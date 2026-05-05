"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useSavedArticles } from "@/lib/store/saved-articles";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function SavedCount() {
  const storeCount = useSavedArticles((s) => s.savedIds.length);
  const hydrated = useHydrated();

  const count = hydrated ? storeCount : 0;

  return (
    <Link
      href="/saved"
      className="text-gn-text-secondary hover:text-gn-text relative transition-colors"
      aria-label={`${count} artikuj te ruajtur`}
    >
      <svg
        className="h-[18px] w-[18px]"
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
        <span className="bg-gn-accent text-gn-text-inverse absolute -top-1.5 -right-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
