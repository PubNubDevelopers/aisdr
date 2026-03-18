import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Skip middleware for static files and most API routes
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon") ||
    request.nextUrl.pathname.includes(".") ||
    (request.nextUrl.pathname.startsWith("/api") && !request.nextUrl.pathname.startsWith("/api/auth"))
  ) {
    return NextResponse.next();
  }

  // Allow access to the login page
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get("aisdr-auth");
  
  if (!authCookie || authCookie.value !== "authenticated") {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};