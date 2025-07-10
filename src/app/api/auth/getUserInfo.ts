"use client";

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export const getUserInfo = (): UserInfo | null => {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const userCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("user_info=")
  );

  if (userCookie) {
    try {
      const userInfoStr = userCookie.split("=")[1];
      return JSON.parse(decodeURIComponent(userInfoStr));
    } catch (error) {
      console.error("Error parsing user info:", error);
    }
  }

  return null;
};
