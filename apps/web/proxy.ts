import { NextResponse } from "next/server";

// All data lives on the .NET API and Auth.js owns sessions, so the only thing
// this proxy does today is pass requests through. Keeping the file exports a
// no-op handler so the route conventions stay the same; remove when other
// proxy concerns get reintroduced.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
