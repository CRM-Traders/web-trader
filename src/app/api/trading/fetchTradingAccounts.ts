"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";
import { TradingAccountDto } from "../types/trading";

export const fetchTradingAccounts = async () => {
  const result = await apiFetcher<TradingAccountDto[]>("traiding/api/TradingAccounts/user", {
    method: "GET",
    fallbackErrorMessages: {
      401: "Authentication required to access trading accounts",
      403: "Access denied to trading accounts",
      404: "No trading accounts found",
      500: "Trading accounts service temporarily unavailable",
    },
  });
  return result;
};
