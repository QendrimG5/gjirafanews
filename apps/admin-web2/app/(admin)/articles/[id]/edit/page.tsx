"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useGetArticleQuery, useUpdateArticleMutation } from "@/lib/api";
import ArticleForm, { type ArticleFormData } from "@/components/article-form";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: article, isLoading } = useGetArticleQuery(id);
  const { mutateAsync: updateArticle, isPending } = useUpdateArticleMutation();

  async function handleSubmit(data: ArticleFormData) {
    await updateArticle({ id, data });
    router.push("/");
  }

  if (isLoading) {
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
          href="/"
          className="text-gn-text-tertiary hover:text-gn-text text-sm transition-colors"
        >
          &larr; Kthehu te artikujt
        </Link>
        <h1 className="text-gn-text mt-2 text-2xl font-bold">
          Ndrysho artikullin
        </h1>
      </div>

      <div className="bg-gn-surface border-gn-border-light rounded-xl border p-6">
        <ArticleForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          submitLabel="Ruaj ndryshimet"
        />
      </div>
    </div>
  );
}
