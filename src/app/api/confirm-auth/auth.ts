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

// Logout function (client-side)
export const logout = async (): Promise<void> => {
  try {
    // Call server action to clear cookies
    const { clearAuthCookies } = await import(
      "@/app/api/confirm-auth/postConfirmAuth"
    );
    await clearAuthCookies();

    // Redirect to sign-in
    window.location.href = "https://online.salesvault.dev/auth/login";
  } catch (error) {
    console.error("Error during logout:", error);
    // Fallback: redirect anyway
    window.location.href = "https://online.salesvault.dev/auth/login";
  }
};
