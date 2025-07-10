"use server";

import { cookies } from "next/headers";

export const deleteSession = async () => {
  const cookieStore = await cookies();

  // Clear all auth-related cookies
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("session");
  cookieStore.delete("rememberMe");
};

export const createSession = async (
  accessToken: string,
  refreshToken: string,
  userData?: any
) => {
  const cookieStore = await cookies();

  const sessionData = {
    token: accessToken,
    refreshToken: refreshToken,
    user: userData,
    createdAt: new Date().toISOString(),
  };

  // Set session cookie with all data
  cookieStore.set("session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // Also set individual token cookies for backward compatibility
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
};
