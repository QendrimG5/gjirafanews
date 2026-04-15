/**
 * ArticlesTable — virtualized data table for article lists.
 *
 * Uses @tanstack/react-virtual for efficient rendering of large lists.
 * Both headers and body cells are fully dynamic — driven by the columns array.
 * Each column defines its own render function, so the table has no opinion
 * about cell content (text, badges, buttons, links, etc.).
 *
 * @prop columns      — Array of Column objects defining headers and cell renderers.
 * @prop articles     — The data array (ArticleWithRelations[]).
 * @prop emptyMessage — Text shown when articles is empty. Defaults to "Nuk ka artikuj. Krijo nje te ri."
 *
 * Column shape:
 *   key       — Unique identifier for React keys.
 *   label     — Header text (rendered uppercase).
 *   width     — CSS width string (e.g. "35%", "200px").
 *   align     — "left" (default) or "right".
 *   className — Extra CSS classes on the <td>.
 *   render    — (article: ArticleWithRelations) => ReactNode — cell content.
 *
 * @example
 * const columns: Column[] = [
 *   {
 *     key: "title",
 *     label: "Titulli",
 *     width: "35%",
 *     render: (a) => <span className="text-sm font-medium">{a.title}</span>,
 *   },
 *   {
 *     key: "category",
 *     label: "Kategoria",
 *     width: "15%",
 *     render: (a) => (
 *       <span style={{ backgroundColor: a.category.color }} className="rounded-full px-2 py-0.5 text-xs text-white">
 *         {a.category.name}
 *       </span>
 *     ),
 *   },
 *   {
 *     key: "actions",
 *     label: "Veprime",
 *     width: "20%",
 *     align: "right",
 *     render: (a) => <Button variant="danger" size="sm" onClick={() => onDelete(a.id)}>Fshi</Button>,
 *   },
 * ];
 *
 * <ArticlesTable columns={columns} articles={articles} />
 *
 * // Custom empty message
 * <ArticlesTable columns={columns} articles={[]} emptyMessage="Asnje rezultat." />
 */
import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ArticleWithRelations } from "@gjirafanews/types";

const ROW_HEIGHT = 53;
const OVERSCAN = 5;

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div className="bg-gn-surface border-gn-border overflow-hidden rounded-xl border">
      <table className="w-full">
        <thead>
          <tr className="border-gn-border bg-gn-overlay border-b">
            {columns.map((col) => (
              <th
                key={col.label}
                className={`text-gn-text-tertiary px-4 py-3 text-xs font-semibold uppercase ${col.align === "right" ? "text-right" : "text-left"}`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
      </table>

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
                const article = articles[virtualRow.index];
                return (
                  <tr
                    key={article.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="border-gn-border-light hover:bg-gn-overlay border-b transition-colors"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}
                        style={{ width: col.width }}
                      >
                        {col.render(article)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {articles.length === 0 && (
        <div className="text-gn-text-tertiary px-4 py-8 text-center">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
