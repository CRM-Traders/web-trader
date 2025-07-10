"use client";

// Client-side utility to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check for auth_status cookie
  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_status=")
  );

  return authCookie?.includes("authenticated") || false;
};

// Get user info from cookies (client-side)
export const getUserInfo = (): {
  id: string;
  email: string;
  name: string;
} | null => {
  if (typeof window === "undefined") return null;

  try {
    const cookies = document.cookie.split(";");
    const userCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("user_info=")
    );

    if (userCookie) {
      const userInfoStr = userCookie.split("=")[1];
      return JSON.parse(decodeURIComponent(userInfoStr));
    }
  } catch (error) {
    console.error("Error parsing user info:", error);
  }

  return null;
};

// Get session data from cookies (client-side)
export const getSessionData = (): {
  token: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
} | null => {
  if (typeof window === "undefined") return null;

  try {
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("session=")
    );

    if (sessionCookie) {
      const sessionStr = sessionCookie.split("=")[1];
      return JSON.parse(decodeURIComponent(sessionStr));
    }
  } catch (error) {
    console.error("Error parsing session data:", error);
  }

  return null;
};

// Check if session is valid (client-side)
export const isSessionValid = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const sessionData = getSessionData();
    if (!sessionData?.token) return false;

    // Parse JWT to check expiration
    const base64Url = sessionData.token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    
    // Check if token is expired (with 5 minute buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes buffer
    return payload.exp > (currentTime + bufferTime);
  } catch (error) {
    console.error("Error checking session validity:", error);
    return false;
  }
};

// Get access token from session (client-side)
export const getAccessToken = (): string | null => {
  const sessionData = getSessionData();
  return sessionData?.token || null;
};

// Get refresh token from session (client-side)
export const getRefreshToken = (): string | null => {
  const sessionData = getSessionData();
  return sessionData?.refreshToken || null;
};

// Logout function (client-side)
export const logout = async (): Promise<void> => {
  try {
    // Call server action to clear cookies
    const { clearAuthCookies } = await import(
      "@/app/api/confirm-auth/postConfirmAuth"
    );
    await clearAuthCookies();

    // Redirect to sign-in
    window.location.href = "https://online.salesvault.dev/login";
  } catch (error) {
    console.error("Error during logout:", error);
    // Fallback: redirect anyway
    window.location.href = "https://online.salesvault.dev/login";
  }
};
