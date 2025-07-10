import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { postRefreshToken } from "@/app/api/auth/postRefreshToken";
import { COOKIE_CONFIG } from "@/app/api/const/session";

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

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const pathname = url.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);
  requestHeaders.set("x-origin", origin);
  requestHeaders.set("x-pathname", pathname);

  // Define protected paths for trading and dashboard
  const protectedPaths = ["/trading-view"];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Handle API routes that require authentication
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isTradingApi = request.nextUrl.pathname.includes('/api/trading-accounts') || 
                      request.nextUrl.pathname.includes('/api/Trading') ||
                      request.nextUrl.pathname.includes('/api/Wallets');

  // Check if there's a ctx parameter in the URL (ongoing authentication flow)
  const hasCtxParam = request.nextUrl.searchParams.has('ctx');

  // If accessing auth pages with valid session, redirect to dashboard
  // if () {
  //   const sessionCookie = request.cookies.get(COOKIE_CONFIG.SESSION.name);
  //   if (sessionCookie) {
  //     try {
  //       const sessionData = JSON.parse(sessionCookie.value);
  //       const { token } = sessionData;
  //       if (token && !isJWTExpiredSync(token)) {
  //         return NextResponse.redirect(new URL("/trading-view", request.url));
  //       }
  //     } catch {
  //       // Invalid session, continue to auth page
  //     }
  //   }
  //   return NextResponse.next();
  // }

  // Skip middleware for non-protected paths and non-trading API routes
  if (!isProtectedPath && (!isApiRoute || !isTradingApi)) {
    return NextResponse.next();
  }

  // Allow access to protected paths if there's a ctx parameter (ongoing auth flow)
  if (hasCtxParam) {
    console.log("\x1b[33m[CTX PARAM DETECTED]\x1b[0m Allowing access for authentication flow");
    console.log("URL:", request.url);
    console.log("Pathname:", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  console.log("\x1b[36m[MIDDLEWARE DEBUG]\x1b[0m Processing request:", {
    pathname,
    isProtectedPath,
    isApiRoute,
    isTradingApi,
    hasCtxParam,
  });

  const cookie = request.cookies.get(COOKIE_CONFIG.SESSION.name);
  console.log("\x1b[36m[MIDDLEWARE DEBUG]\x1b[0m Session cookie exists:", !!cookie);
  
  if (!cookie) {
    console.log(
      "\x1b[41m\x1b[97m[NO SESSION COOKIE]\x1b[0m Redirecting to login"
    );
    return NextResponse.redirect(new URL("https://online.salesvault.dev/login", request.url));
  }

  let sessionData;
  try {
    sessionData = JSON.parse(cookie.value);
  } catch {
    console.log(
      "\x1b[41m\x1b[97m[INVALID SESSION DATA]\x1b[0m Redirecting to login"
    );
    const response = NextResponse.redirect(new URL("https://online.salesvault.dev/login", request.url));
    response.cookies.delete(COOKIE_CONFIG.SESSION.name);
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  const { token, refreshToken } = sessionData;

  const needsRefresh = isJWTExpiredSync(token);
  if (needsRefresh) {
    console.log("\x1b[44m\x1b[97m[TOKEN EXPIRED]\x1b[0m Trying refresh...");
    if (!refreshToken) {
      console.log(
        "\x1b[41m\x1b[97m[NO REFRESH TOKEN]\x1b[0m Redirecting to login"
      );
      const response = NextResponse.redirect(new URL("https://online.salesvault.dev/login", request.url));
      response.cookies.delete(COOKIE_CONFIG.SESSION.name);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
    
    const refreshed = await postRefreshToken(token, refreshToken);
    if (
      !refreshed.success ||
      !refreshed.data?.accessToken ||
      !refreshed.data?.refreshToken
    ) {
      console.log(
        "\x1b[41m\x1b[97m[REFRESH FAILED]\x1b[0m Invalid refresh token"
      );
      const response = NextResponse.redirect(new URL("https://online.salesvault.dev/login", request.url));
      response.cookies.delete(COOKIE_CONFIG.SESSION.name);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    console.log("\x1b[42m\x1b[30m[REFRESH SUCCESSFUL]\x1b[0m Token updated!");
    // Set updated session with new tokens
    const updatedSession = {
      ...sessionData,
      token: refreshed.data.accessToken,
      refreshToken: refreshed.data.refreshToken,
      updatedAt: new Date().toISOString(),
    };

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set(
      COOKIE_CONFIG.SESSION.name,
      JSON.stringify(updatedSession),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    response.cookies.set("access_token", refreshed.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    response.cookies.set("refresh_token", refreshed.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Add the new token to the request headers for API routes
    if (isApiRoute) {
      requestHeaders.set('Authorization', `Bearer ${refreshed.data.accessToken}`);
    }

    return response;
  }

  console.log("\x1b[32m[TOKEN VALID]\x1b[0m Continuing request");
  
  // Add the token to the request headers for API routes
  if (isApiRoute) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }
  
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}; 
