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
      label: "Titulli",
      width: "35%",
      render: (a) => (
        <span className="text-gn-text line-clamp-1 text-sm font-medium">
          {a.title}
        </span>
      ),
    },
    {
      key: "source",
      label: "Burimi",
      width: "15%",
      className: "text-gn-text-tertiary text-sm",
      render: (a) => a.source.name,
    },
    {
      key: "date",
      label: "Data",
      width: "15%",
      className: "text-gn-text-tertiary text-sm",
      render: (a) =>
        new Date(a.publishedAt).toLocaleDateString("sq-AL"),
    },
    {
      key: "actions",
      label: "Veprime",
      width: "20%",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/articles/${a.id}/edit`}
            className="text-gn-text-secondary border-gn-border hover:bg-gn-primary hover:text-gn-text-inverse rounded-md border px-3 py-1 text-xs font-medium transition-colors"
          >
            Ndrysho
          </Link>
          <button
            onClick={() => handleDelete(a.id, a.title)}
            disabled={deletingId === a.id}
            className="text-gn-danger border-gn-danger hover:bg-gn-danger hover:text-gn-text-inverse rounded-md border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
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
        <div className="bg-gn-surface border-gn-border overflow-hidden rounded-xl border">
          <div className="border-gn-border bg-gn-overlay flex gap-4 border-b px-4 py-3">
            <div className="bg-gn-border h-3 w-[35%] rounded" />
            <div className="bg-gn-border h-3 w-[15%] rounded" />
            <div className="bg-gn-border h-3 w-[15%] rounded" />
            <div className="bg-gn-border h-3 w-[20%] rounded" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-gn-border-light flex gap-4 border-b px-4 py-4"
            >
              <div className="bg-gn-border h-4 w-[35%] rounded" />
              <div className="bg-gn-border h-4 w-[15%] rounded" />
              <div className="bg-gn-border h-4 w-[15%] rounded" />
              <div className="bg-gn-border h-4 w-[20%] rounded" />
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gn-text text-2xl font-bold">Artikujt</h1>
        <Link
          to="/articles/new"
          className="bg-gn-primary text-gn-text-inverse rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90"
        >
          + Artikull i ri
        </Link>
      </div>

      <ArticlesTable columns={columns} articles={articles ?? []} />
    </div>
  );
}
