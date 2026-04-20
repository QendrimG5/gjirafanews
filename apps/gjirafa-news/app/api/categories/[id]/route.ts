import { NextRequest } from "next/server";
import { categories, articles } from "@/lib/data";
import { requireAdmin } from "@/lib/auth-guard";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const inUse = articles.filter((a) => a.categoryId === id).length;
  if (inUse > 0) {
    return Response.json(
      {
        error: `Category has ${inUse} article(s). Reassign or delete them first.`,
      },
      { status: 409 },
    );
  }

  const [removed] = categories.splice(idx, 1);
  return Response.json({ message: "deleted", id: removed.id });
}
