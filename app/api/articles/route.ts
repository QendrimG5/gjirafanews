import { NextRequest } from "next/server";
import {
  articles,
  getArticleWithRelations,
  generateId,
  categories,
  sources,
} from "@/lib/data";

// GET /api/articles?category=sport&search=kosova
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");

  let result = [...articles];

  // Filter by category slug
  if (category) {
    const cat = categories.find((c) => c.slug === category);
    if (cat) {
      result = result.filter((a) => a.categoryId === cat.id);
    }
  }

  // Search in title and summary
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q)
    );
  }

  // Sort by publishedAt descending
  result.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Limit
  result = result.slice(0, limit);

  // Join with relations
  const articlesWithRelations = result.map(getArticleWithRelations);

  return Response.json(articlesWithRelations);
}

// POST /api/articles — Create a new article
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { title, summary, content, imageUrl, categoryId, sourceId, readTime } = body;

  if (!title || !summary || !content || !categoryId || !sourceId) {
    return Response.json(
      { error: "Missing required fields: title, summary, content, categoryId, sourceId" },
      { status: 400 }
    );
  }

  // Validate category and source exist
  if (!categories.find((c) => c.id === categoryId)) {
    return Response.json({ error: "Invalid categoryId" }, { status: 400 });
  }
  if (!sources.find((s) => s.id === sourceId)) {
    return Response.json({ error: "Invalid sourceId" }, { status: 400 });
  }

  const newArticle = {
    id: generateId(),
    title,
    summary,
    content,
    imageUrl: imageUrl || "https://picsum.photos/seed/new/800/400",
    publishedAt: new Date().toISOString(),
    readTime: readTime || 3,
    categoryId,
    sourceId,
  };

  articles.push(newArticle);

  return Response.json(getArticleWithRelations(newArticle), { status: 201 });
}
