"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetArticleQuery,
  useUpdateArticleMutation,
} from "@/lib/store/api";
import ArticleForm, { ArticleFormData } from "@/components/article-form";

// Edit article page.
//
// Next.js 16 passes params as a Promise to page components. Since this is a
// client component ("use client"), we can't use `await`. Instead we use
// React 19's `use()` hook which unwraps the Promise synchronously during
// render (it suspends if the promise isn't resolved yet).
//
// useGetArticleQuery(id) → fires GET /api/articles/:id. The data populates
// the form's initialData prop. TanStack Query caches this under
// ["articles", id], so navigating back to edit the same article is instant.
//
// useUpdateArticleMutation() → fires PUT /api/articles/:id with the form
// data. On success, invalidates both ["articles"] (list) and ["articles", id]
// (detail) so both the dashboard table and this edit page see fresh data.

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: article, isLoading: isLoadingArticle } =
    useGetArticleQuery(id);
  const { mutateAsync: updateArticle, isPending: isUpdating } =
    useUpdateArticleMutation();

  async function handleSubmit(data: ArticleFormData) {
    await updateArticle({ id, data });
    router.push("/admin");
  }

  if (isLoadingArticle) {
    return (
      <div className="text-gn-text-tertiary">Duke ngarkuar artikullin...</div>
    );
  }

  if (!article) {
    return <div className="text-gn-text-tertiary">Artikulli nuk u gjet.</div>;
  }

  const initialData: ArticleFormData = {
    title: article.title,
    summary: article.summary,
    content: article.content,
    imageUrl: article.imageUrl,
    categoryId: article.categoryId,
    sourceId: article.sourceId,
    readTime: article.readTime,
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-gn-text-tertiary hover:text-gn-text transition-colors"
        >
          &larr; Kthehu te artikujt
        </Link>
        <h1 className="text-2xl font-bold text-gn-text mt-2">
          Ndrysho artikullin
        </h1>
      </div>

      <div className="bg-gn-surface rounded-xl border border-gn-border-light p-6">
        <ArticleForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
          submitLabel="Ruaj ndryshimet"
        />
      </div>
    </div>
  );
}
