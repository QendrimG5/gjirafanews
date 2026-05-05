import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session-edge";

const ADMIN_WEB_ORIGIN =
  process.env.ADMIN_WEB_ORIGIN ?? "http://localhost:3002";

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Authorization, Content-Type";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api")) {
    const origin = request.headers.get("origin");
    const isAllowedOrigin = origin === ADMIN_WEB_ORIGIN;

    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ADMIN_WEB_ORIGIN,
          "Access-Control-Allow-Methods": ALLOWED_METHODS,
          "Access-Control-Allow-Headers": ALLOWED_HEADERS,
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    const response = NextResponse.next();
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", ADMIN_WEB_ORIGIN);
      response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
      response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
      response.headers.set("Vary", "Origin");
    }
    return response;
  }

  const sessionCookie = request.cookies.get("session")?.value;
  const session = await decrypt(sessionCookie);

  if (path.startsWith("/admin")) {
    if (!session?.userId) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
  }

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
  matcher: ["/api/:path*", "/admin/:path*", "/login"],
};
