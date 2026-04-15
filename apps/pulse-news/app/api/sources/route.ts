import { sources } from "@/lib/data";

// GET /api/sources
export async function GET() {
  return Response.json(sources);
}
