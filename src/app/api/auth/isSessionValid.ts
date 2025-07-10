"use client";

import { getSessionData } from "./getSessionData";

export const isSessionValid = (): boolean => {
  if (typeof window === "undefined") return false;

  const sessionData = getSessionData();
  if (!sessionData?.token) return false;

  try {
    // Parse JWT to check expiration
    const base64Url = sessionData.token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    // Check if token is expired (with 5 minute buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes buffer
    return payload.exp > currentTime + bufferTime;
  } catch (error) {
    console.error("Error checking session validity:", error);
    return false;
  }
};
