"use client";

import { useState, useEffect } from "react";
import { useGetCategoriesQuery, useGetSourcesQuery } from "@/lib/store/api";

// Reusable form for creating and editing articles.
//
// useGetCategoriesQuery() and useGetSourcesQuery() fetch reference data for
// the dropdown selects. TanStack Query caches these with a 10-minute staleTime
// (configured in api.ts), so switching between create/edit pages doesn't
// trigger redundant network requests — the dropdowns populate instantly from
// the warm cache.
//
// The `initialData` prop is undefined for create mode and populated for edit
// mode. The useEffect syncs form state when initialData arrives (it may load
// asynchronously from the article query).

export type ArticleFormData = {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  categoryId: string;
  sourceId: string;
  readTime: number;
};

type ArticleFormProps = {
  initialData?: ArticleFormData;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
};

const emptyForm: ArticleFormData = {
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  categoryId: "",
  sourceId: "",
  readTime: 3,
};

export default function ArticleForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ArticleFormProps) {
  const { data: categories } = useGetCategoriesQuery();
  const { data: sources } = useGetSourcesQuery();
  const [form, setForm] = useState<ArticleFormData>(initialData || emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  function updateField<K extends keyof ArticleFormData>(
    key: K,
    value: ArticleFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      !form.title ||
      !form.summary ||
      !form.content ||
      !form.categoryId ||
      !form.sourceId
    ) {
      setError("Ploteso te gjitha fushat e kerkuara.");
      return;
    }

    try {
      await onSubmit(form);
    } catch {
      setError("Gabim gjate ruajtjes se artikullit.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-gn-red">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gn-text-secondary mb-1">
          Titulli *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gn-text-secondary mb-1">
          Permbledhja *
        </label>
        <textarea
          value={form.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gn-text-secondary mb-1">
          Permbajtja *
        </label>
        <textarea
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gn-text-secondary mb-1">
          URL e fotos
        </label>
        <input
          type="text"
          value={form.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
          placeholder="https://picsum.photos/seed/example/800/400"
          className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gn-text-secondary mb-1">
            Kategoria *
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
          >
            <option value="">Zgjidh kategorine</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gn-text-secondary mb-1">
            Burimi *
          </label>
          <select
            value={form.sourceId}
            onChange={(e) => updateField("sourceId", e.target.value)}
            className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
          >
            <option value="">Zgjidh burimin</option>
            {sources?.map((src) => (
              <option key={src.id} value={src.id}>
                {src.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-32">
        <label className="block text-sm font-medium text-gn-text-secondary mb-1">
          Koha e leximit (min)
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={form.readTime}
          onChange={(e) =>
            updateField("readTime", parseInt(e.target.value) || 3)
          }
          className="w-full px-3 py-2 border border-gn-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2.5 bg-gn-primary text-gn-text-inverse rounded-lg text-sm font-semibold hover:bg-gn-primary-dark transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Duke ruajtur..." : submitLabel}
      </button>
    </form>
  );
}
