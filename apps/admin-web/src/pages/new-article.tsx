import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCreateArticleMutation } from "@/lib/api";
import ArticleForm, { type ArticleFormData } from "@/components/article-form";

export default function NewArticlePage() {
  const navigate = useNavigate();
  const { mutateAsync: createArticle, isPending } =
    useCreateArticleMutation();

  async function handleSubmit(data: ArticleFormData) {
    await createArticle(data);
    navigate("/");
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/"
          className="text-gn-text-tertiary hover:text-gn-text text-sm transition-colors"
        >
          &larr; Kthehu te artikujt
        </Link>
        <h1 className="text-gn-text mt-2 text-2xl font-bold">Artikull i ri</h1>
      </div>

      <div className="bg-gn-surface border-gn-border-light rounded-xl border p-6">
        <ArticleForm
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          submitLabel="Krijo artikullin"
        />
      </div>
    </div>
  );
}
