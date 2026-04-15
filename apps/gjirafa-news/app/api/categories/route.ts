import { categories, articles } from "@/lib/data";

// GET /api/categories
export async function GET() {
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    articleCount: articles.filter((a) => a.categoryId === cat.id).length,
  }));

  return Response.json(categoriesWithCount);
}
