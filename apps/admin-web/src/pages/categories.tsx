import { useState } from "react";
import { Input, Button } from "@gjirafanews/ui";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/lib/api";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useGetCategoriesQuery();
  const createMut = useCreateCategoryMutation();
  const deleteMut = useDeleteCategoryMutation();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#1a7f37");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Emri eshte i detyrueshem.");
      return;
    }
    try {
      await createMut.mutateAsync({ name: name.trim(), color });
      setName("");
      setColor("#1a7f37");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Gabim gjate krijimit.";
      setError(msg);
    }
  }

  async function handleDelete(id: string, hasArticles: boolean) {
    if (hasArticles) {
      alert("Kjo kategori ka artikuj. Fshije ose ndryshoji artikujt me pare.");
      return;
    }
    if (!confirm("Fshij kategorine?")) return;
    try {
      await deleteMut.mutateAsync(id);
    } catch (err: unknown) {
      alert(
        (err as { data?: { error?: string } })?.data?.error ??
        "Gabim gjate fshirjes.",
      );
    }
  }

  if (isLoading) {
    return <div className="text-gn-text">Duke ngarkuar...</div>;
  }
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-gn-text text-2xl font-bold tracking-tight">
        Kategorite
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-gn-danger bg-gn-danger-muted border-gn-danger/20 rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Emri *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p.sh. Shendetesi"
        />
        <div>
          <label className="text-gn-text mb-1 block text-sm font-medium">
            Ngjyra
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border-gn-border-light h-10 w-20 cursor-pointer rounded border"
          />
        </div>
        <Button type="submit" disabled={createMut.isPending} size="lg">
          {createMut.isPending ? "Duke ruajtur..." : "Shto kategorine"}
        </Button>
      </form>

      <div>
        <h2 className="text-gn-text mb-3 text-lg font-semibold">Ekzistuese</h2>
        <ul className="border-gn-border-light divide-gn-border-light divide-y overflow-hidden rounded-lg border">
          {categories?.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-medium">{c.name}</span>
                <span className="text-gn-text-tertiary text-xs">
                  /{c.slug} · {c.articleCount} artikuj
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c.id, c.articleCount > 0)}
                className="text-gn-danger text-xs font-medium hover:underline disabled:opacity-50"
                disabled={deleteMut.isPending}
              >
                Fshi
              </button>
            </li>
          ))}
          {categories && categories.length === 0 && (
            <li className="text-gn-text-tertiary p-3 text-sm">
              Nuk ka kategori.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
