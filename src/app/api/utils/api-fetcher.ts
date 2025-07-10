import { cookies } from "next/headers";

// Import the getAccessToken function
const getAccessToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    // First try to get from session cookie
    const sessionCookie = cookieStore.get("session");
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        return sessionData.token || null;
      } catch {
        // Invalid session data, fall back to individual cookie
      }
    }
    // Fall back to individual access token cookie
    const token = cookieStore.get("accessToken");
    return token?.value || null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  statusCode: number | null;
  success: boolean;
}

export interface FetcherOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, unknown> | string | FormData | null;
  noAuth?: boolean;
  fallbackErrorMessages?: { [key: number]: string };
  headers?: HeadersInit;
}

export const apiFetcher = async <T = unknown>(
  endpoint: string,
  options: FetcherOptions = {}
): Promise<ApiResponse<T>> => {
  console.log("🌐 [apiFetcher] Making request to:", endpoint);

  const baseUrl = process.env.API_URL;
  console.log("🌐 [apiFetcher] Base URL:", baseUrl);

  // Only get access token if auth is required
  let accessToken = null;
  if (!options.noAuth) {
    accessToken = await getAccessToken();
    console.log("🌐 [apiFetcher] Access token exists:", !!accessToken);
    if (accessToken) {
      console.log(
        "🌐 [apiFetcher] Access token preview:",
        accessToken.substring(0, 20) + "..."
      );
    }
  }

  const defaultOptions: FetcherOptions = {
    method: "GET",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  };

  const url = `${baseUrl}/${endpoint}`;
  console.log("🌐 [apiFetcher] Full URL:", url);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...defaultOptions.headers,
    ...options.headers,
  };

  try {
    console.log("🌐 [apiFetcher] Making fetch request...");

    // Handle different body types
    let bodyContent: string | FormData | null = null;
    if (options.body) {
      if (
        typeof options.body === "string" ||
        options.body instanceof FormData
      ) {
        bodyContent = options.body;
      } else {
        bodyContent = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url, {
      method: options.method || defaultOptions.method,
      headers: headers,
      body: bodyContent,
    });

    const statusCode = response.status;
    console.log("🌐 [apiFetcher] Response status:", statusCode);

    let data = null;
    let error = null;

    if (response.ok) {
      try {
        data = await response.json();
        console.log("🌐 [apiFetcher] Response data received:", !!data);
      } catch (jsonError) {
        // If the response is 204 No Content, then return null data
        if (statusCode === 204) {
          data = null;
        } else {
          error = "Failed to parse JSON response";
          console.log("🌐 [apiFetcher] JSON parse error:", jsonError);
        }
      }
    } else {
      let errorMessage = `Request failed with status ${statusCode}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log("🌐 [apiFetcher] Error response:", errorData);
      } catch (jsonError) {
        console.log("🌐 [apiFetcher] Could not parse error response");
      }

      if (
        options.fallbackErrorMessages &&
        options.fallbackErrorMessages[statusCode]
      ) {
        errorMessage = options.fallbackErrorMessages[statusCode];
      }

      error = errorMessage;
    }

    console.log("🌐 [apiFetcher] Final result:", {
      success: response.ok && !error,
      error,
      hasData: !!data,
    });

    return {
      data: data as T,
      error,
      statusCode,
      success: response.ok && !error,
    };
  } catch (e: unknown) {
    console.error("🌐 [apiFetcher] Network error:", e);
    const errorMessage =
      e instanceof Error ? e.message : "An unexpected error occurred";
    return {
      data: null,
      error: errorMessage,
      statusCode: null,
      success: false,
    };
  }
};
