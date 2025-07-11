import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { postRefreshToken } from "@/app/api/auth/postRefreshToken";
import { COOKIE_CONFIG } from "./app/api/const/session";

const parseJwtSync = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

const isJWTExpiredSync = (token: string): boolean => {
  const payload = parseJwtSync(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

const LOGIN_URL = "https://online.salesvault.dev/login";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const pathname = url.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);
  requestHeaders.set("x-origin", origin);
  requestHeaders.set("x-pathname", pathname);

  const publicPaths = ["/", "/auth"];

  const protectedPaths = [
    "/dashboard",
    "/trading",
    "/finance",
    "/spot-trading",
    "/trading-view",
  ];

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const ctx = url.searchParams.get("ctx");
  if (ctx && isProtectedPath) {
    console.log(
      "\x1b[43m\x1b[30m[CTX DETECTED]\x1b[0m Allowing access for auth confirmation"
    );
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isPublicPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!isProtectedPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const sessionCookie = request.cookies.get(COOKIE_CONFIG.SESSION.name);

  if (!sessionCookie) {
    console.log(
      "\x1b[41m\x1b[97m[NO SESSION COOKIE]\x1b[0m Redirecting to external login"
    );
    return NextResponse.redirect(new URL(LOGIN_URL));
  }

  let sessionData;
  try {
    sessionData = JSON.parse(sessionCookie.value);
  } catch {
    console.log(
      "\x1b[41m\x1b[97m[INVALID SESSION DATA]\x1b[0m Redirecting to external login"
    );
    const response = NextResponse.redirect(new URL(LOGIN_URL));
    response.cookies.delete(COOKIE_CONFIG.SESSION.name);
    response.cookies.delete(COOKIE_CONFIG.ACCESS_TOKEN.name);
    response.cookies.delete(COOKIE_CONFIG.REFRESH_TOKEN.name);
    response.cookies.delete("user_info");
    response.cookies.delete("auth_status");
    return response;
  }

  const { token, refreshToken } = sessionData;

  if (!token) {
    console.log(
      "\x1b[41m\x1b[97m[NO ACCESS TOKEN]\x1b[0m Redirecting to external login"
    );
    const response = NextResponse.redirect(new URL(LOGIN_URL));
    response.cookies.delete(COOKIE_CONFIG.SESSION.name);
    response.cookies.delete(COOKIE_CONFIG.ACCESS_TOKEN.name);
    response.cookies.delete(COOKIE_CONFIG.REFRESH_TOKEN.name);
    response.cookies.delete("user_info");
    response.cookies.delete("auth_status");
    return response;
  }

  const needsRefresh = isJWTExpiredSync(token);

  if (needsRefresh) {
    console.log("\x1b[44m\x1b[97m[TOKEN EXPIRED]\x1b[0m Attempting refresh...");

    if (!refreshToken) {
      console.log(
        "\x1b[41m\x1b[97m[NO REFRESH TOKEN]\x1b[0m Redirecting to external login"
      );
      const response = NextResponse.redirect(new URL(LOGIN_URL));
      response.cookies.delete(COOKIE_CONFIG.SESSION.name);
      response.cookies.delete(COOKIE_CONFIG.ACCESS_TOKEN.name);
      response.cookies.delete(COOKIE_CONFIG.REFRESH_TOKEN.name);
      response.cookies.delete("user_info");
      response.cookies.delete("auth_status");
      return response;
    }

    const refreshResult = await postRefreshToken(refreshToken);

    if (
      !refreshResult.success ||
      !refreshResult.data?.accessToken ||
      !refreshResult.data?.refreshToken
    ) {
      console.log(
        "\x1b[41m\x1b[97m[REFRESH FAILED]\x1b[0m Redirecting to external login"
      );
      const response = NextResponse.redirect(new URL(LOGIN_URL));
      response.cookies.delete(COOKIE_CONFIG.SESSION.name);
      response.cookies.delete(COOKIE_CONFIG.ACCESS_TOKEN.name);
      response.cookies.delete(COOKIE_CONFIG.REFRESH_TOKEN.name);
      response.cookies.delete("user_info");
      response.cookies.delete("auth_status");
      return response;
    }

    console.log("\x1b[42m\x1b[30m[REFRESH SUCCESSFUL]\x1b[0m Updating tokens");

    const newTokenPayload = parseJwtSync(refreshResult.data.accessToken);
    const userData = {
      id: newTokenPayload?.Uid || newTokenPayload?.sub,
      email: newTokenPayload?.Email || newTokenPayload?.email,
      name: newTokenPayload?.FullName || newTokenPayload?.name,
      role: newTokenPayload?.Role || newTokenPayload?.role,
    };

    const updatedSession = {
      ...sessionData,
      token: refreshResult.data.accessToken,
      refreshToken: refreshResult.data.refreshToken,
      user: userData,
      updatedAt: new Date().toISOString(),
    };

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Set updated cookies
    response.cookies.set(
      COOKIE_CONFIG.SESSION.name,
      JSON.stringify(updatedSession),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_CONFIG.SESSION.maxAge,
        path: "/",
      }
    );

    response.cookies.set(
      COOKIE_CONFIG.ACCESS_TOKEN.name,
      refreshResult.data.accessToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
        path: "/",
      }
    );

    response.cookies.set(
      COOKIE_CONFIG.REFRESH_TOKEN.name,
      refreshResult.data.refreshToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
        path: "/",
      }
    );

    // Update user info cookie
    response.cookies.set("user_info", JSON.stringify(userData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_CONFIG.SESSION.maxAge,
      path: "/",
    });

    // Update auth status
    response.cookies.set("auth_status", "authenticated", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_CONFIG.SESSION.maxAge,
      path: "/",
    });

    return response;
  }

  console.log("\x1b[32m[TOKEN VALID]\x1b[0m Continuing request");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
