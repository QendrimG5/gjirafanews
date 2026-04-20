import { useState } from "react";
import { Link } from "react-router-dom";
import { ArticlesTable, type Column } from "@gjirafanews/ui";
import { useGetArticlesQuery, useDeleteArticleMutation } from "@/lib/api";

export default function DashboardPage() {
  const { data: articles, isLoading, error } = useGetArticlesQuery();
  const { mutateAsync: deleteArticle } = useDeleteArticleMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`A jeni te sigurt qe doni te fshini artikullin "${title}"?`))
      return;
    try {
      setDeletingId(id);
      await deleteArticle(id);
    } catch {
      alert("Gabim gjate fshirjes se artikullit.");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column[] = [
    {
      key: "title",
      label: "Artikulli",
      width: "minmax(0, 1fr)",
      render: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-gn-border-light h-12 w-16 shrink-0 overflow-hidden rounded-md">
            <img
              src={a.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-gn-text truncate text-sm font-medium">
              {a.title}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: a.category.color }}
              >
                {a.category.name}
              </span>
              <span className="text-gn-text-tertiary text-xs">
                {a.readTime} min lexim
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      label: "Burimi",
      width: "180px",
      render: (a) => (
        <span className="text-gn-text-secondary text-sm">{a.source.name}</span>
      ),
    },
    {
      key: "date",
      label: "Data",
      width: "140px",
      render: (a) => (
        <span className="text-gn-text-secondary text-sm tabular-nums">
          {new Date(a.publishedAt).toLocaleDateString("sq-AL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Veprime",
      width: "200px",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/articles/${a.id}/edit`}
            className="text-gn-text-secondary border-gn-border hover:bg-gn-primary hover:text-gn-text-inverse hover:border-gn-primary inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors"
          >
            Ndrysho
          </Link>
          <button
            onClick={() => handleDelete(a.id, a.title)}
            disabled={deletingId === a.id}
            className="text-gn-danger border-gn-danger hover:bg-gn-danger hover:text-gn-text-inverse inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors disabled:opacity-50"
          >
            Fshi
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6 flex items-center justify-between">
          <div className="bg-gn-border h-8 w-32 rounded" />
          <div className="bg-gn-border h-10 w-36 rounded-lg" />
        </div>
        <div className="bg-gn-surface border-gn-border overflow-hidden rounded-xl border shadow-sm">
          <div className="border-gn-border bg-gn-overlay flex gap-4 border-b px-5 py-3.5">
            <div className="bg-gn-border h-3 w-[50%] rounded" />
            <div className="bg-gn-border h-3 w-[18%] rounded" />
            <div className="bg-gn-border h-3 w-[14%] rounded" />
            <div className="bg-gn-border h-3 w-[18%] rounded" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-gn-border-light flex items-center gap-4 border-b px-5 py-3"
            >
              <div className="bg-gn-border h-12 w-16 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <div className="bg-gn-border h-3 w-3/4 rounded" />
                <div className="bg-gn-border h-2 w-1/3 rounded" />
              </div>
              <div className="bg-gn-border h-3 w-20 rounded" />
              <div className="bg-gn-border h-3 w-16 rounded" />
              <div className="bg-gn-border h-8 w-28 rounded" />
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

  const count = articles?.length ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-gn-text text-2xl font-bold tracking-tight">
            Artikujt
          </h1>
          <p className="text-gn-text-tertiary mt-1 text-sm">
            {count} {count === 1 ? "artikull" : "artikuj"} gjithsej
          </p>
        </div>
        <Link
          to="/articles/new"
          className="bg-gn-primary text-gn-text-inverse inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          + Artikull i ri
        </Link>
      </div>

      <ArticlesTable columns={columns} articles={articles ?? []} />
    </div>
  );
}
