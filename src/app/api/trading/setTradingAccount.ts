"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";

export const setTradingAccount = async (tradingAccountId: string) => {
  if (!tradingAccountId) {
    return {
      success: false,
      error: "Trading account ID is required",
      data: null,
      statusCode: 400,
    };
  }

  return apiFetcher<void>("identity/api/users/set-trading-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      tradingAccountId: tradingAccountId,
    },
    fallbackErrorMessages: {
      400: "Invalid trading account ID",
      401: "Authentication required to set trading account",
      403: "Access denied to set trading account",
      404: "Trading account not found",
      500: "Set trading account service temporarily unavailable",
    },
  });
};
