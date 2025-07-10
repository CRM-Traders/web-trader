"use client";

interface SessionData {
  token: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const getSessionData = (): SessionData | null => {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("session=")
  );

  if (sessionCookie) {
    try {
      const sessionStr = sessionCookie.split("=")[1];
      return JSON.parse(decodeURIComponent(sessionStr));
    } catch (error) {
      console.error("Error parsing session data:", error);
    }
  }

  return null;
};
