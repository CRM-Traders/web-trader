"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";
import type { WalletDto } from "@/app/api/types/trading";

export const fetchWalletBalances = async (tradingAccountId: string) => {
  if (!tradingAccountId) {
    return {
      success: false,
      error: "Trading account ID is required",
      data: null,
      statusCode: 400,
    };
  }

  const response = await apiFetcher<WalletDto[]>(`traiding/api/Wallets/${tradingAccountId}`, {
    method: "GET",
    fallbackErrorMessages: {
      401: "Authentication required to access wallets",
      403: "Access denied to wallets",
      404: "Trading account or wallets not found",
      500: "Wallets service temporarily unavailable",
    },
  });
  return response;
};
