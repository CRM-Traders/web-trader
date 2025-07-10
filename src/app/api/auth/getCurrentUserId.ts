"use server";

import { cookies } from "next/headers";

export const getCurrentUserId = async (): Promise<string | null> => {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session");
  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      if (sessionData.user?.id) {
        return sessionData.user.id;
      }
    } catch (error) {
      console.error("Failed to parse session cookie:", error);
    }
  }

  const userInfoCookie = cookieStore.get("user_info");
  if (userInfoCookie) {
    try {
      const userInfo = JSON.parse(userInfoCookie.value);
      return userInfo.id || null;
    } catch (error) {
      console.error("Failed to parse user_info cookie:", error);
    }
  }

  return null;
};
