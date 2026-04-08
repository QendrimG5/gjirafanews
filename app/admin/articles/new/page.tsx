"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateArticleMutation } from "@/lib/store/api";
import ArticleForm, { ArticleFormData } from "@/components/article-form";

// Create article page.
//
// useCreateArticleMutation() returns { mutateAsync, isPending }.
// `mutateAsync(data)` fires POST /api/articles with the form data.
// On success, the mutation invalidates ["articles"] so the admin dashboard
// table refetches and shows the new article.

export default function NewArticlePage() {
  const router = useRouter();
  const { mutateAsync: createArticle, isPending } = useCreateArticleMutation();

  async function handleSubmit(data: ArticleFormData) {
    await createArticle(data);
    router.push("/admin");
  }

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
          Artikull i ri
        </h1>
      </div>

      <div className="bg-gn-surface rounded-xl border border-gn-border-light p-6">
        <ArticleForm
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          submitLabel="Krijo artikullin"
        />
      </div>
    </div>
  );
}
