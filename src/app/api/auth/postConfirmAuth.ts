"use server";

import { cookies } from "next/headers";
import { apiFetcher } from "@/app/api/utils/api-fetcher";
import type { LoginResponse } from "@/app/api/types/auth";

// Helper function to decode JWT and extract user info
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

export const postConfirmAuth = async (ctx: string): Promise<boolean> => {
  if (!ctx) return false;

  console.log("🔐 Starting postConfirmAuth with ctx:", ctx);

  // Clear all existing auth data first
  const cookieStore = await cookies();
  console.log("🧹 Clearing existing auth data before setting new tokens...");
  cookieStore.delete("session");
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("user_info");
  cookieStore.delete("auth_status");

  const response = await apiFetcher<LoginResponse>(
    `identity/api/auth/confirm-auth?authKey=${ctx}`,
    {
      method: "GET",
      noAuth: true,
      fallbackErrorMessages: {
        400: "Invalid auth key provided",
        401: "Auth key expired or invalid",
        404: "Auth key not found",
        500: "Auth confirmation service temporarily unavailable",
      },
    }
  );

  console.log("🔐 Auth confirmation response:", {
    success: response.success,
    statusCode: response.statusCode,
    hasData: !!response.data,
    error: response.error,
  });

  if (!response.success || !response.data?.accessToken) {
    console.error("❌ Authentication failed:", response.error);
    return false;
  }

  const data = response.data;

  // Decode the new access token to get user info
  const tokenPayload = decodeJWT(data.accessToken);
  console.log("🔍 Decoded token payload:", {
    Uid: tokenPayload?.Uid,
    sub: tokenPayload?.sub,
    Email: tokenPayload?.Email,
    FullName: tokenPayload?.FullName,
    Role: tokenPayload?.Role,
    exp: tokenPayload?.exp,
    iat: tokenPayload?.iat,
  });

  // Extract user ID from token (try the correct field names from your JWT)
  const userIdFromToken =
    tokenPayload?.Uid ||
    tokenPayload?.sub ||
    tokenPayload?.userId ||
    tokenPayload?.id ||
    tokenPayload?.nameid ||
    tokenPayload?.unique_name;

  // Extract email from token
  const emailFromToken = tokenPayload?.Email || tokenPayload?.email;

  // Extract full name from token
  const fullNameFromToken =
    tokenPayload?.FullName || tokenPayload?.name || tokenPayload?.fullName;

  console.log("👤 User info from token:", {
    id: userIdFromToken,
    email: emailFromToken,
    fullName: fullNameFromToken,
  });

  // Create session data with user info from both API response and token
  const sessionData = {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    user: {
      id: userIdFromToken || data.user?.id,
      email: emailFromToken || data.user?.email,
      name: fullNameFromToken || data.user?.name,
      role: tokenPayload?.Role || "",
      ...data.user, // Include any other user data from API
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("💾 Setting session data:", {
    hasToken: !!sessionData.token,
    hasRefreshToken: !!sessionData.refreshToken,
    userId: sessionData.user?.id,
    userEmail: sessionData.user?.email,
    userName: sessionData.user?.name,
  });

  // Set session cookie (contains the full session including token)
  cookieStore.set("session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: data.expires_in || 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // Set individual access token cookie (for easier access)
  cookieStore.set("accessToken", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  // Set refresh token cookie
  if (data.refreshToken) {
    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  // Set user info for client-side access (non-httpOnly)
  const userInfo = {
    id: userIdFromToken || data.user?.id,
    email: emailFromToken || data.user?.email,
    name: fullNameFromToken || data.user?.name,
    role: tokenPayload?.Role || "",
  };

  cookieStore.set("user_info", JSON.stringify(userInfo), {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: data.expires_in || 60 * 60 * 24 * 7,
    path: "/",
  });

  // Set auth timestamp for cache busting
  cookieStore.set("auth_timestamp", Date.now().toString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: data.expires_in || 60 * 60 * 24 * 7,
    path: "/",
  });

  console.log(
    "✅ Authentication successful and cookies set for user:",
    userIdFromToken
  );
  return true;
};
