"use server"

import { cookies } from "next/headers"
import { logApiError, errorCodes } from "@/app/api/utils"

/**
 * Get access token from cookies with fallback logic
 * First tries session cookie, then falls back to accessToken cookie
 */
const getAccessToken = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies()

    // First try to get from session cookie
    const sessionCookie = cookieStore.get("session")
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value)
        return sessionData.token || null
      } catch {
        // Invalid session data, fall back to individual cookie
      }
    }

    // Fall back to individual access token cookie
    const token = cookieStore.get("accessToken")
    return token?.value || null
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * API Response interface
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  statusCode: number | null
  success: boolean
}

/**
 * Fetcher options interface
 */
export interface FetcherOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: Record<string, unknown> | string | FormData | null
  noAuth?: boolean
  fallbackErrorMessages?: Record<number, string>
  headers?: HeadersInit
  cache?: RequestCache
  next?: NextFetchRequestConfig
}

/**
 * API Fetcher - A utility for making API requests in Next.js server actions
 *
 * This utility handles common API request patterns including:
 * - Setting the base URL from environment variables
 * - Adding authorization headers with token fallback logic
 * - Handling different body types (JSON, FormData, string)
 * - Consistent error handling with logging
 * - Type-safe responses
 *
 * @template T - The expected data type of a successful response
 * @param {string} endpoint - The API endpoint path (will be appended to API_URL)
 * @param {FetcherOptions} options - Request options
 * @returns {Promise<ApiResponse<T>>} - A standardized response object
 *
 * @example
 * // Basic GET request
 * const response = await apiFetcher<User[]>('/users')
 *
 * @example
 * // POST request with body
 * const response = await apiFetcher<User>('/users', {
 *   method: 'POST',
 *   body: { name: 'John', email: 'john@example.com' }
 * })
 *
 * @example
 * // With custom error messages
 * const response = await apiFetcher<AuthResponse>('/auth/login', {
 *   method: 'POST',
 *   body: { username, password },
 *   fallbackErrorMessages: {
 *     401: 'Invalid username or password',
 *     429: 'Too many login attempts, please try again later'
 *   }
 * })
 */
export const apiFetcher = async <T = unknown>(
  endpoint: string,
  options: FetcherOptions = {},
): Promise<ApiResponse<T>> => {
  const baseUrl = process.env.API_URL

  if (!baseUrl) {
    await logApiError({
      endpoint,
      options,
      rawErrorData: new Error("API_URL environment variable is not set"),
      fallbackMessage: "Configuration error",
    })

    return {
      data: null,
      error: "API configuration error",
      statusCode: null,
      success: false,
    }
  }

  // Get access token if auth is required
  let accessToken = null
  if (!options.noAuth) {
    accessToken = await getAccessToken()
  }

  // Merge default options with provided options
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }

  const mergedOptions = {
    method: "GET" as const,
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    fallbackErrorMessages: {
      ...errorCodes,
      ...options.fallbackErrorMessages,
    },
  }

  const url = `${baseUrl}/${endpoint.replace(/^\//, "")}`

  try {
    // Handle different body types
    let bodyContent: string | FormData | null = null
    let finalHeaders = { ...mergedOptions.headers }

    if (mergedOptions.body) {
      if (typeof mergedOptions.body === "string" || mergedOptions.body instanceof FormData) {
        bodyContent = mergedOptions.body
        // Remove Content-Type for FormData to let browser set it with boundary
        if (mergedOptions.body instanceof FormData) {
          const { "Content-Type": _, ...headersWithoutContentType } = finalHeaders as Record<string, string>
          finalHeaders = headersWithoutContentType
        }
      } else {
        bodyContent = JSON.stringify(mergedOptions.body)
      }
    }

    const response = await fetch(url, {
      method: mergedOptions.method,
      headers: finalHeaders,
      body: bodyContent,
      cache: mergedOptions.cache,
      next: mergedOptions.next,
    })

    const statusCode = response.status

    if (response.ok) {
      let data = null

      try {
        const contentType = response.headers.get("content-type")

        if (statusCode === 204) {
          // No Content response
          data = null
        } else if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          // Handle non-JSON responses
          data = await response.text()
        }
      } catch (parseError) {
        await logApiError({
          endpoint,
          options: mergedOptions,
          response,
          rawErrorData: parseError,
          fallbackMessage: "Failed to parse successful response",
        })

        return {
          data: null,
          error: "Failed to parse response data",
          statusCode,
          success: false,
        }
      }

      return {
        data: data as T,
        error: null,
        statusCode,
        success: true,
      }
    } else {
      // Handle error responses
      let errorMessage = `Request failed with status ${statusCode}`
      let errorData = null

      try {
        const contentType = response.headers.get("content-type")

        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } else {
          const textResponse = await response.text()
          errorMessage = textResponse || errorMessage
        }
      } catch (parseError) {
        // Could not parse error response, use fallback
      }

      // Use fallback error message if available
      if (mergedOptions.fallbackErrorMessages && statusCode in mergedOptions.fallbackErrorMessages) {
        errorMessage = mergedOptions.fallbackErrorMessages[statusCode as keyof typeof mergedOptions.fallbackErrorMessages]
      }

      await logApiError({
        endpoint,
        options: mergedOptions,
        response,
        rawErrorData: errorData,
        fallbackMessage: errorMessage,
      })

      return {
        data: null,
        error: errorMessage,
        statusCode,
        success: false,
      }
    }
  } catch (networkError) {
    const errorMessage = networkError instanceof Error ? networkError.message : "An unexpected network error occurred"

    await logApiError({
      endpoint,
      options: mergedOptions,
      rawErrorData: networkError,
      fallbackMessage: errorMessage,
    })

    return {
      data: null,
      error: errorMessage,
      statusCode: null,
      success: false,
    }
  }
}
