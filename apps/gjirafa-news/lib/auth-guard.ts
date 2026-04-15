import { getSession } from "@/lib/session";

export async function requireAdmin(): Promise<
  | {
      authorized: true;
      session: {
        userId: string;
        role: string;
        name: string;
        email: string;
      };
    }
  | { authorized: false; response: Response }
> {
  const session = await getSession();

  if (!session) {
    return {
      authorized: false,
      response: Response.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (session.role !== "admin") {
    return {
      authorized: false,
      response: Response.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}
