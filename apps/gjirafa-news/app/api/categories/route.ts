import { NextRequest } from "next/server";
import {
  categories,
  articles,
  generateCategoryId,
  slugify,
} from "@/lib/data";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/categories
export async function GET() {
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    articleCount: articles.filter((a) => a.categoryId === cat.id).length,
  }));

  return Response.json(categoriesWithCount);
}

// POST /api/categories — admin only
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "#1a7f37";
  const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return Response.json(
      { error: "Could not derive a valid slug" },
      { status: 400 },
    );
  }
  if (categories.some((c) => c.slug === slug)) {
    return Response.json({ error: "Slug already exists" }, { status: 409 });
  }
  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return Response.json({ error: "Name already exists" }, { status: 409 });
  }

  const newCategory = { id: generateCategoryId(), name, slug, color };
  categories.push(newCategory);

  return Response.json(newCategory, { status: 201 });
}
