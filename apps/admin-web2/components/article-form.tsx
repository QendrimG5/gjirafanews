"use client";

import { useState } from "react";
import type { ArticleFormData } from "@gjirafanews/types";
import { Input, Select, Textarea, Button } from "@gjirafanews/ui";
import { useGetCategoriesQuery, useGetSourcesQuery } from "@/lib/api";

export type { ArticleFormData } from "@gjirafanews/types";

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
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  const [form, setForm] = useState<ArticleFormData>(initialData || emptyForm);
  const [error, setError] = useState("");

  if (initialData && initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setForm(initialData);
  }

  function updateField<K extends keyof ArticleFormData>(
    key: K,
    value: ArticleFormData[K],
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="text-gn-danger bg-gn-danger-muted border-gn-danger/20 rounded-lg border p-3 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Titulli *"
        type="text"
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
      />

      <Textarea
        label="Permbledhja *"
        value={form.summary}
        onChange={(e) => updateField("summary", e.target.value)}
        rows={2}
      />

      <Textarea
        label="Permbajtja *"
        value={form.content}
        onChange={(e) => updateField("content", e.target.value)}
        rows={8}
      />

      <Input
        label="URL e fotos"
        type="text"
        value={form.imageUrl}
        onChange={(e) => updateField("imageUrl", e.target.value)}
        placeholder="https://picsum.photos/seed/example/800/400"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Kategoria *"
          value={form.categoryId}
          onChange={(e) => updateField("categoryId", e.target.value)}
        >
          <option value="">Zgjidh kategorine</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>

        <Select
          label="Burimi *"
          value={form.sourceId}
          onChange={(e) => updateField("sourceId", e.target.value)}
        >
          <option value="">Zgjidh burimin</option>
          {sources?.map((src) => (
            <option key={src.id} value={src.id}>
              {src.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-32">
        <Input
          label="Koha e leximit (min)"
          type="number"
          min={1}
          max={30}
          value={form.readTime}
          onChange={(e) =>
            updateField("readTime", parseInt(e.target.value) || 3)
          }
        />
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Duke ruajtur..." : submitLabel}
      </Button>
    </form>
  );
}
