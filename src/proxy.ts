import jwt, { JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getDefaultDashboardRoute,
  getRouteOwner,
  getUserDashboardRoute,
  isAuthRoute,
  UserRole,
} from "./lib/auth-utils";
import { getNewAccessToken } from "./service/auth/auth.service";
import { deleteCookie, getCookie } from "./service/auth/tokenHandlers";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle token refresh redirect loop prevention
  if (request.nextUrl.searchParams.has("tokenRefreshed")) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("tokenRefreshed");
    return NextResponse.redirect(url);
  }

  const tokenRefreshResult = await getNewAccessToken();
  if (tokenRefreshResult?.tokenRefreshed) {
    const url = request.nextUrl.clone();
    url.searchParams.set("tokenRefreshed", "true");
    return NextResponse.redirect(url);
  }

  // 2. Get & verify access token
  const accessToken = (await getCookie("accessToken")) || null;
  let userRole: UserRole | null = null;

  if (accessToken) {
    try {
      const verifiedToken = jwt.verify(
        accessToken,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      if (typeof verifiedToken === "string" || !verifiedToken.role) {
        throw new Error("Invalid token");
      }

      userRole = verifiedToken.role as UserRole;
    } catch {
      await deleteCookie("accessToken");
      await deleteCookie("refreshToken");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const routeOwner = getRouteOwner(pathname);
  const isAuth = isAuthRoute(pathname);

  // 3. Not logged in → only auth pages (login, register...) are reachable.
  //    Everything else, including "/", goes to login (no public home page).
  if (!accessToken) {
    if (isAuth) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // From here on the user is logged in.

  // 4. Logged-in user on auth routes → dashboard
  if (isAuth) {
    return NextResponse.redirect(
      new URL(getDefaultDashboardRoute(userRole as UserRole), request.url)
    );
  }

  // 5. Logged-in user on "/" (no home page) → their dashboard
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(getDefaultDashboardRoute(userRole as UserRole), request.url)
    );
  }

  // 6. Other public routes (routeOwner === null)
  if (routeOwner === null) {
    return NextResponse.next();
  }

  // 7. Common protected routes
  if (routeOwner === "COMMON") {
    return NextResponse.next();
  }

  // 8. /dashboard → role dashboard
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return NextResponse.redirect(
      new URL(getUserDashboardRoute(userRole), request.url)
    );
  }

  // 9. Role-based protection
  if (userRole === "ADMIN") {
    return NextResponse.next();
  }

  if (routeOwner === "MODERATOR" && userRole === "MODERATOR") {
    return NextResponse.next();
  }

  if (routeOwner === "ADMIN" || routeOwner === "MODERATOR") {
    return NextResponse.redirect(
      new URL(getDefaultDashboardRoute(userRole as UserRole), request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skips API, Next internals, and any file with an extension
    // (/asset/logo.png, fonts, etc.) so the login page can load its images.
    "/((?!api|_next/static|_next/image|asset|favicon.ico|sitemap.xml|robots.txt|.well-known|.*\\..*).*)",
  ],
};