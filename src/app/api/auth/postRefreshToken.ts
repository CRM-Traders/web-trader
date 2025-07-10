interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

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
  accessToken: string,
  refreshToken: string
): Promise<RefreshTokenResponse> {
  console.log("postRefreshToken", {
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
  try {
    const response = await fetch(
      `${process.env.BASE_IDENTITY_URL}/api/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
        } as RefreshTokenRequest),
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken, // Use existing if not provided
          expires_in: data.expires_in,
        },
      };
    } else {
      const errorText = await response.text();
      console.error("Failed to refresh token:", response.status, errorText);
      return {
        success: false,
        error: `Failed to refresh token: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return {
      success: false,
      error: "Network error during token refresh",
    };
  }
} 