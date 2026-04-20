/**
 * ArticlesTable — data table for article lists.
 *
 * Uses CSS Grid (not <table>) so header and rows share a single
 * `grid-template-columns` string and columns line up exactly, regardless
 * of cell content width. For large lists, swap in virtualization later;
 * for typical admin page sizes this renders fine as-is.
 *
 * Column shape:
 *   key       — React key + column id.
 *   label     — Header text (rendered uppercase).
 *   width     — Any valid grid track size (e.g. "2fr", "180px", "minmax(0,1fr)").
 *   align     — "left" (default) or "right".
 *   className — Extra CSS classes on the cell.
 *   render    — (article) => ReactNode — cell content.
 */
import type { ReactNode } from "react";
import type { ArticleWithRelations } from "@gjirafanews/types";

export type Column = {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right";
  className?: string;
  render: (article: ArticleWithRelations) => ReactNode;
};

export type ArticlesTableProps = {
  columns: Column[];
  articles: ArticleWithRelations[];
  emptyMessage?: string;
};

export default function ArticlesTable({
  columns,
  articles,
  emptyMessage = "Nuk ka artikuj. Krijo nje te ri.",
}: ArticlesTableProps) {
  const gridTemplateColumns = columns.map((c) => c.width).join(" ");

  return (
    <div className="bg-gn-surface border-gn-border overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div
        role="row"
        className="bg-gn-overlay border-gn-border text-gn-text-tertiary grid items-center gap-4 border-b px-5 py-3.5 text-[11px] font-semibold tracking-wider uppercase"
        style={{ gridTemplateColumns }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            role="columnheader"
            className={`min-w-0 ${col.align === "right" ? "text-right" : "text-left"}`}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Body */}
      {articles.length === 0 ? (
        <div className="text-gn-text-tertiary px-5 py-12 text-center text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div
          role="rowgroup"
          className="max-h-[calc(100vh-280px)] overflow-auto"
        >
          {articles.map((article) => (
            <div
              key={article.id}
              role="row"
              className="border-gn-border-light hover:bg-gn-overlay grid items-center gap-4 border-b px-5 py-3 transition-colors last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="cell"
                  className={`min-w-0 ${
                    col.align === "right" ? "text-right" : ""
                  } ${col.className ?? ""}`}
                >
                  {col.render(article)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
