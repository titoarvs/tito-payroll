import { type NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/settings",
  "/shop",
  "/cart",
  "/orders",
  "/notifications",
  "/users",
  "/audit",
  "/admin",
];

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Optimistic cookie check only — real auth happens in requireSession/requireAdmin.
  const sessionToken =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/settings",
    "/settings/:path*",
    "/shop",
    "/shop/:path*",
    "/cart",
    "/cart/:path*",
    "/orders",
    "/orders/:path*",
    "/notifications",
    "/notifications/:path*",
    "/users",
    "/users/:path*",
    "/audit",
    "/audit/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
