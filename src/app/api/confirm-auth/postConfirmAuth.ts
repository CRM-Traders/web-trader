"use server";

import { cookies } from "next/headers";

interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const postConfirmAuth = async (ctx: string): Promise<boolean> => {
  if (!ctx) return false;

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
      console.log("Auth response data:", data);

      if (data.access_token) {
        // Get cookies instance
        const cookieStore = await cookies();

        // Set access token cookie
        cookieStore.set("access_token", data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: data.expires_in || 60 * 60 * 24 * 7, // Default 7 days if not provided
          path: "/",
        });

        // Set refresh token if provided
        if (data.refresh_token) {
          cookieStore.set("refresh_token", data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
            path: "/",
          });
        }

        // Set user info if provided (optional, for client-side access)
        if (data.user) {
          cookieStore.set("user_info", JSON.stringify(data.user), {
            httpOnly: false, // Allow client-side access for user info
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: data.expires_in || 60 * 60 * 24 * 7,
            path: "/",
          });
        }

        // Set authentication status
        cookieStore.set("auth_status", "authenticated", {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: data.expires_in || 60 * 60 * 24 * 7,
          path: "/",
        });

        console.log("Cookies set successfully");
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

// Helper function to get access token from cookies (for other server actions)
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");
    return token?.value || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

// Helper function to clear auth cookies (for logout)
export const clearAuthCookies = async (): Promise<void> => {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_info");
    cookieStore.delete("auth_status");

    console.log("Auth cookies cleared");
  } catch (error) {
    console.error("Error clearing auth cookies:", error);
  }
};

// Helper function to refresh access token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token");

    if (!refreshToken?.value) {
      console.error("No refresh token available");
      return false;
    }

    const response = await fetch(
      `${process.env.BASE_IDENTITY_URL}/api/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken.value}`,
        },
      }
    );

    if (response.status === 200) {
      const data: AuthResponse = await response.json();

      if (data.access_token) {
        // Update access token
        cookieStore.set("access_token", data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: data.expires_in || 60 * 60 * 24 * 7,
          path: "/",
        });

        // Update refresh token if provided
        if (data.refresh_token) {
          cookieStore.set("refresh_token", data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          });
        }

        console.log("Access token refreshed successfully");
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
