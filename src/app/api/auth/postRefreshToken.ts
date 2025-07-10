interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expires_in?: number;
  };
  error?: string;
}

export async function postRefreshToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  console.log(
    "🔄 [postRefreshToken] Attempting to refresh token with refreshToken:",
    refreshToken?.substring(0, 20) + "..."
  );

  if (!refreshToken) {
    return {
      success: false,
      error: "No refresh token provided",
    };
  }

  try {
    const response = await fetch(
      `${process.env.BASE_IDENTITY_URL}/api/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      }
    );

    console.log("🔄 [postRefreshToken] Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("🔄 [postRefreshToken] Refresh successful:", {
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        expires_in: data.expires_in,
      });

      return {
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expires_in: data.expires_in,
        },
      };
    } else {
      const errorText = await response.text();
      console.error(
        "❌ [postRefreshToken] Failed to refresh token:",
        response.status,
        errorText
      );
      return {
        success: false,
        error: `Failed to refresh token: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("💥 [postRefreshToken] Error refreshing token:", error);
    return {
      success: false,
      error: "Network error during token refresh",
    };
  }
}
