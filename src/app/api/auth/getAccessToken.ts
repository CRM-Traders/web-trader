"use server";

import { cookies } from "next/headers";

export const getAccessToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();

  // First try to get from session cookie
  const sessionCookie = cookieStore.get("session");
  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      return sessionData.token || null;
    } catch {
      // Invalid session data, fall back to individual cookie
    }
  }

  // Fall back to individual access token cookie
  const token = cookieStore.get("accessToken");
  return token?.value || null;
};
