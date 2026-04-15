import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session-edge";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log(`Proxy middleware: ${request.method} ${path}`);
  const sessionCookie = request.cookies.get("session")?.value;
  const session = await decrypt(sessionCookie);

  // Protect /admin/* -- require admin role
  if (path.startsWith("/admin")) {
    if (!session?.userId) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
  }

  // Redirect logged-in admins away from /login
  if (
    path.startsWith("/login") &&
    session?.userId &&
    session.role === "admin"
  ) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
