import { cookies } from "next/headers";

// Types for token refresh
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expires_in?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Helper function to check if token is expired (with 5 minute buffer)
export function isTokenExpired(token: string): boolean {
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
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
  try {
    const response = await fetch(`${process.env.BASE_IDENTITY_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data: RefreshTokenResponse = await response.json();
      return data;
    } else {
      console.error('Failed to refresh token:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Helper function to get access token from cookies (for server actions)
export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    return token?.value || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

// Helper function to get refresh token from cookies (for server actions)
export async function getRefreshToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token");
    return token?.value || null;
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
}

// Helper function to set cookies (for server actions)
export async function setAuthCookies(
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number,
  userInfo?: any
): Promise<void> {
  try {
    const cookieStore = await cookies();

    // Set access token cookie
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: expiresIn || 60 * 60 * 24 * 7, // Default 7 days
      path: "/",
    });

    // Set refresh token if provided
    if (refreshToken) {
      cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
        path: "/",
      });
    }

    // Set user info if provided
    if (userInfo) {
      cookieStore.set("user_info", JSON.stringify(userInfo), {
        httpOnly: false, // Allow client-side access for user info
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: expiresIn || 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // Set authentication status
    cookieStore.set("auth_status", "authenticated", {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: expiresIn || 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch (error) {
    console.error("Error setting auth cookies:", error);
  }
}

// Helper function to clear auth cookies (for logout)
export async function clearAuthCookies(): Promise<void> {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_info");
    cookieStore.delete("auth_status");
  } catch (error) {
    console.error("Error clearing auth cookies:", error);
  }
}

// Function to get a valid access token (with automatic refresh if needed)
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (!accessToken) {
      return null;
    }

    // Check if access token is expired
    if (isTokenExpired(accessToken)) {
      if (!refreshToken) {
        console.error("Access token expired and no refresh token available");
        return null;
      }

      // Attempt to refresh the token
      const refreshResult = await refreshAccessToken(refreshToken);
      
      if (refreshResult && refreshResult.accessToken) {
        // Update cookies with new tokens
        await setAuthCookies(
          refreshResult.accessToken,
          refreshResult.refreshToken,
          refreshResult.expires_in
        );
        
        return refreshResult.accessToken;
      } else {
        console.error("Failed to refresh access token");
        return null;
      }
    }

    return accessToken;
  } catch (error) {
    console.error("Error getting valid access token:", error);
    return null;
  }
} 
