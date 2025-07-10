"use client";

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_status=")
  );

  return authCookie?.includes("authenticated") || false;
};
