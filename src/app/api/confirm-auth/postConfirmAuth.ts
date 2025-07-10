"use server";

import { cookies } from "next/headers";
import { COOKIE_CONFIG } from "@/app/api/const/session";

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const postConfirmAuth = async (ctx: string): Promise<boolean> => {
  if (!ctx) return false;

  console.log("Starting postConfirmAuth with ctx:", ctx);

  try {
    const response = await fetch(
      `${process.env.BASE_IDENTITY_URL}/api/auth/confirm-auth?authKey=${ctx}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Auth response status:", response.status);

    if (response.status === 200) {
      const data: AuthResponse = await response.json();
      console.log("Auth response data:", { 
        hasAccessToken: !!data.accessToken, 
        hasRefreshToken: !!data.refreshToken,
        hasUser: !!data.user,
        expires_in: data.expires_in 
      });

      if (data.accessToken) {
        // Get cookies instance
        const cookieStore = await cookies();

        // Create session data
        const sessionData = {
          token: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log("Setting session cookie with data:", {
          hasToken: !!sessionData.token,
          hasRefreshToken: !!sessionData.refreshToken,
          hasUser: !!sessionData.user,
        });

        // Set session cookie
        cookieStore.set(COOKIE_CONFIG.SESSION.name, JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: data.expires_in || COOKIE_CONFIG.SESSION.maxAge,
          path: "/",
        });

        // Set individual token cookies for backward compatibility
        cookieStore.set("access_token", data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
          path: "/",
        });

        if (data.refreshToken) {
          cookieStore.set("refresh_token", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
            path: "/",
          });
        }

        // Set user info if provided (for client-side access)
        if (data.user) {
          cookieStore.set("user_info", JSON.stringify(data.user), {
            httpOnly: false, // Allow client-side access for user info
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: data.expires_in || COOKIE_CONFIG.SESSION.maxAge,
            path: "/",
          });
        }

        // Set authentication status
        cookieStore.set("auth_status", "authenticated", {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: data.expires_in || COOKIE_CONFIG.SESSION.maxAge,
          path: "/",
        });

        console.log("Successfully set all cookies");
        return true;
      } else {
        console.error("No access token in response");
        return false;
      }
    } else {
      console.error("Authentication failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Error in postConfirmAuth:", error);
    return false;
  }
};

// Helper function to get access token from session cookie
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    
    // First try to get from session cookie
    const sessionCookie = cookieStore.get(COOKIE_CONFIG.SESSION.name);
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        return sessionData.token || null;
      } catch {
        // Invalid session data, fall back to individual cookie
      }
    }
    
    // Fall back to individual access token cookie
    const token = cookieStore.get("access_token");
    return token?.value || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// Helper function to get refresh token from session cookie
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    
    // First try to get from session cookie
    const sessionCookie = cookieStore.get(COOKIE_CONFIG.SESSION.name);
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        return sessionData.refreshToken || null;
      } catch {
        // Invalid session data, fall back to individual cookie
      }
    }
    
    // Fall back to individual refresh token cookie
    const token = cookieStore.get("refresh_token");
    return token?.value || null;
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

// Helper function to clear auth cookies (for logout)
export const clearAuthCookies = async (): Promise<void> => {
  try {
    const cookieStore = await cookies();

    cookieStore.delete(COOKIE_CONFIG.SESSION.name);
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_info");
    cookieStore.delete("auth_status");
  } catch (error) {
    console.error("Error clearing auth cookies:", error);
  }
};

// Helper function to refresh access token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const cookieStore = await cookies();
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      console.error("No refresh token available");
      return false;
    }

    const response = await fetch(
      `${process.env.BASE_IDENTITY_URL}/api/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      const data: AuthResponse = await response.json();

      if (data.accessToken) {
        // Get current session data
        const sessionCookie = cookieStore.get(COOKIE_CONFIG.SESSION.name);
        let sessionData = {};
        
        if (sessionCookie) {
          try {
            sessionData = JSON.parse(sessionCookie.value);
          } catch {
            // Invalid session data, create new
          }
        }

        // Update session data
        const updatedSession = {
          ...sessionData,
          token: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
          updatedAt: new Date().toISOString(),
        };

        // Update session cookie
        cookieStore.set(COOKIE_CONFIG.SESSION.name, JSON.stringify(updatedSession), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: data.expires_in || COOKIE_CONFIG.SESSION.maxAge,
          path: "/",
        });

        // Update individual token cookies
        cookieStore.set("access_token", data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_CONFIG.ACCESS_TOKEN.maxAge,
          path: "/",
        });

        if (data.refreshToken) {
          cookieStore.set("refresh_token", data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: COOKIE_CONFIG.REFRESH_TOKEN.maxAge,
            path: "/",
          });
        }

        return true;
      }
    }

    console.error("Failed to refresh access token");
    return false;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return false;
  }
};
