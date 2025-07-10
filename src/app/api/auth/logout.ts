"use client";

export const logout = async (): Promise<void> => {
  // Call server action to clear cookies
  const { clearAuthCookies } = await import("@/app/api/auth/clearAuthCookies");
  await clearAuthCookies();

  // Redirect to sign-in
  window.location.href = "https://online.salesvault.dev/login";
};
