import { NextRequest, NextResponse } from 'next/server';

// Types for token refresh
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expires_in?: number;
}

interface ApiError {
  message: string;
  statusCode: number;
}

// Helper function to get token from cookies
function getTokenFromCookies(request: NextRequest, tokenName: string): string | null {
  const cookie = request.cookies.get(tokenName);
  return cookie?.value || null;
}

// Helper function to set cookie in response
function setCookieInResponse(response: NextResponse, name: string, value: string, options: any = {}) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    ...options,
  };
  
  response.cookies.set(name, value, cookieOptions);
}

// Helper function to check if token is expired (with 5 minute buffer)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes buffer
    return payload.exp < (currentTime + bufferTime);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Assume expired if we can't parse
  }
}

// Function to refresh access token
async function refreshAccessToken(accessToken: string, refreshToken: string): Promise<RefreshTokenResponse | null> {
  try {
    console.log('Attempting to refresh token...');
    const response = await fetch(`${process.env.BASE_IDENTITY_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: accessToken,
        refreshToken: refreshToken,
      }),
    });
    console.log(response);

    console.log('Refresh token response status:', response.status);
    
    if (response.ok) {
      const data: RefreshTokenResponse = await response.json();
      console.log('Token refresh successful');
      return data;
    } else {
      const errorText = await response.text();
      console.error('Failed to refresh token:', response.status, errorText);
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Only apply middleware to API routes that require authentication
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isTradingApi = request.nextUrl.pathname.includes('/api/trading-accounts') || 
                      request.nextUrl.pathname.includes('/api/Trading') ||
                      request.nextUrl.pathname.includes('/api/Wallets');
  
  // Skip middleware for non-API routes or non-trading API routes
  if (!isApiRoute || !isTradingApi) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = getTokenFromCookies(request, 'access_token');
  const refreshToken = getTokenFromCookies(request, 'refresh_token');
  console.log(accessToken, refreshToken);
  console.log('Middleware processing:', request.nextUrl.pathname);
  console.log('Access token exists:', !!accessToken);
  console.log('Refresh token exists:', !!refreshToken);

  // If no access token, redirect to sign-in
  if (!accessToken) {
    console.log('No access token found, redirecting to sign-in');
    window.location.href = 'https://online.salesvault.dev/auth/login';
    return NextResponse.next();
  }

  // Check if access token is expired (proactive refresh)
  if (isTokenExpired(accessToken)) {
    console.log('Access token expired, attempting proactive refresh');
    
    // If no refresh token, redirect to sign-in
    if (!refreshToken) {
      console.log('No refresh token found, redirecting to sign-in');
      window.location.href = 'https://online.salesvault.dev/auth/login';
      return NextResponse.next();
    }

    // Attempt to refresh the token
    const refreshResult = await refreshAccessToken(accessToken, refreshToken);
    
    if (refreshResult && refreshResult.accessToken) {
      console.log('Token refreshed proactively');
      
      // Create response with updated cookies and forward the request
      const response = NextResponse.next();
      
      // Set new access token
      setCookieInResponse(response, 'access_token', refreshResult.accessToken, {
        maxAge: refreshResult.expires_in || 60 * 60 * 24 * 7,
      });
      
      // Set new refresh token if provided
      if (refreshResult.refreshToken) {
        setCookieInResponse(response, 'refresh_token', refreshResult.refreshToken, {
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      
      // Add the new token to the request headers
      request.headers.set('Authorization', `Bearer ${refreshResult.accessToken}`);
      
      return response;
    } else {
      console.log('Failed to refresh token proactively, redirecting to sign-in');
      // Clear auth cookies and redirect to sign-in
      const response = NextResponse.redirect(new URL('https://online.salesvault.dev/auth/login', request.url));
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('user_info');
      response.cookies.delete('auth_status');
      return response;
    }
  }

  // Token is valid, add it to the request headers and proceed
  request.headers.set('Authorization', `Bearer ${accessToken}`);
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
