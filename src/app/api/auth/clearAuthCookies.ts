"use server";

import { cookies } from "next/headers";

export const clearAuthCookies = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.delete("session");
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("user_info");
  cookieStore.delete("auth_status");
  cookieStore.delete("auth_timestamp");

  console.log("🧹 Cleared all auth cookies");
};
