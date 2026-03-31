import { NextRequest } from "next/server";
import {
  articles,
  getArticleWithRelations,
  categories,
  sources,
} from "@/lib/data";

// GET /api/articles/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  return Response.json(getArticleWithRelations(article));
}

// PUT /api/articles/:id — Update an article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = articles.findIndex((a) => a.id === id);

  if (index === -1) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, summary, content, imageUrl, categoryId, sourceId, readTime } = body;

  // Validate category and source if provided
  if (categoryId && !categories.find((c) => c.id === categoryId)) {
    return Response.json({ error: "Invalid categoryId" }, { status: 400 });
  }
  if (sourceId && !sources.find((s) => s.id === sourceId)) {
    return Response.json({ error: "Invalid sourceId" }, { status: 400 });
  }

  // Merge with existing article
  articles[index] = {
    ...articles[index],
    ...(title && { title }),
    ...(summary && { summary }),
    ...(content && { content }),
    ...(imageUrl && { imageUrl }),
    ...(categoryId && { categoryId }),
    ...(sourceId && { sourceId }),
    ...(readTime && { readTime }),
  };

  return Response.json(getArticleWithRelations(articles[index]));
}

// DELETE /api/articles/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = articles.findIndex((a) => a.id === id);

  if (index === -1) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  const deleted = articles.splice(index, 1)[0];

  return Response.json({ message: "Article deleted", id: deleted.id });
}
