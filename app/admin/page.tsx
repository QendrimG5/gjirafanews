"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useGetArticlesQuery,
  useDeleteArticleMutation,
} from "@/lib/store/api";

// The table body uses @tanstack/react-virtual to only render the rows that are
// currently visible in the scrollable container. Instead of mounting one <tr>
// per article (which can be hundreds/thousands of DOM nodes), the virtualizer
// measures the scroll position and renders only the ~15-20 rows in the
// viewport plus a small overscan buffer above and below.
//
// How it works:
//
// 1. A scrollable <div> wraps the <table>. Its ref is passed to
//    `useVirtualizer` as `getScrollElement`.
//
// 2. `useVirtualizer({ count, estimateSize })` returns `virtualRows` — an
//    array of objects like `{ index, start, size }` representing only the
//    visible rows.
//
// 3. The <tbody> gets a fixed height equal to `getTotalSize()` (the full
//    virtual height as if all rows were rendered). Each visible <tr> is
//    absolutely positioned at `row.start` pixels from the top.
//
// 4. As the user scrolls, `virtualRows` updates and React only re-renders
//    the handful of rows that enter/leave the viewport.
//
// Result: even with 10,000 articles the DOM only ever has ~20 <tr> elements.

const ROW_HEIGHT = 53; // px — matches the actual rendered row height
const OVERSCAN = 5; // render 5 extra rows above/below viewport as buffer

export default function AdminDashboard() {
  const { data: articles, isLoading, error } = useGetArticlesQuery();
  const { mutateAsync: deleteArticle, isPending: isDeleting } =
    useDeleteArticleMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: articles?.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  async function handleDelete(id: string, title: string) {
    if (
      !confirm(`A jeni te sigurt qe doni te fshini artikullin "${title}"?`)
    ) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteArticle(id);
    } catch {
      alert("Gabim gjate fshirjes se artikullit.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 rounded bg-gn-border" />
          <div className="h-10 w-36 rounded-lg bg-gn-border" />
        </div>
        <div className="bg-gn-surface rounded-xl border border-gn-border overflow-hidden">
          <div className="border-b border-gn-border bg-gn-overlay px-4 py-3 flex gap-4">
            <div className="h-3 w-[35%] rounded bg-gn-border" />
            <div className="h-3 w-[15%] rounded bg-gn-border" />
            <div className="h-3 w-[15%] rounded bg-gn-border" />
            <div className="h-3 w-[15%] rounded bg-gn-border" />
            <div className="h-3 w-[20%] rounded bg-gn-border" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4 border-b border-gn-border-light">
              <div className="h-4 w-[35%] rounded bg-gn-border" />
              <div className="h-4 w-[15%] rounded bg-gn-border" />
              <div className="h-4 w-[15%] rounded bg-gn-border" />
              <div className="h-4 w-[15%] rounded bg-gn-border" />
              <div className="h-4 w-[20%] rounded bg-gn-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-gn-danger">Gabim gjate ngarkimit te artikujve.</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gn-text">Artikujt</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-gn-primary text-gn-text-inverse rounded-lg text-sm font-semibold hover:opacity-90 transition-colors"
        >
          + Artikull i ri
        </Link>
      </div>

      <div className="bg-gn-surface rounded-xl border border-gn-border overflow-hidden">
        {/* Sticky table header — stays visible while scrolling the body */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gn-border bg-gn-overlay">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gn-text-tertiary uppercase w-[35%]">
                Titulli
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gn-text-tertiary uppercase w-[15%]">
                Kategoria
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gn-text-tertiary uppercase w-[15%]">
                Burimi
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gn-text-tertiary uppercase w-[15%]">
                Data
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gn-text-tertiary uppercase w-[20%]">
                Veprime
              </th>
            </tr>
          </thead>
        </table>

        {/* Virtualized scrollable body */}
        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            <table className="w-full">
              <tbody>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const article = articles![virtualRow.index];
                  return (
                    <tr
                      key={article.id}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      className="border-b border-gn-border-light hover:bg-gn-overlay transition-colors"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <td className="px-4 py-3 w-[35%]">
                        <span className="text-sm font-medium text-gn-text line-clamp-1">
                          {article.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-[15%]">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor: article.category.color,
                          }}
                        >
                          {article.category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gn-text-tertiary w-[15%]">
                        {article.source.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gn-text-tertiary w-[15%]">
                        {new Date(article.publishedAt).toLocaleDateString(
                          "sq-AL"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right w-[20%]">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="px-3 py-1 text-xs font-medium text-gn-text-secondary border border-gn-border rounded-md hover:bg-gn-primary hover:text-gn-text-inverse transition-colors"
                          >
                            Ndrysho
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(article.id, article.title)
                            }
                            disabled={isDeleting && deletingId === article.id}
                            className="px-3 py-1 text-xs font-medium text-gn-danger border border-gn-danger rounded-md hover:bg-gn-danger hover:text-gn-text-inverse transition-colors disabled:opacity-50"
                          >
                            Fshi
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {articles?.length === 0 && (
          <div className="px-4 py-8 text-center text-gn-text-tertiary">
            Nuk ka artikuj. Krijo nje te ri.
          </div>
        )}
      </div>
    </div>
  );
}
