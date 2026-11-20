import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAuthConfigured, verifySessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Auth not configured yet (local/dev without secrets): allow through.
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const isLogin = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth/");
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = verifySessionToken(token);

  if (authed && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!authed && !isLogin && !isAuthApi) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
