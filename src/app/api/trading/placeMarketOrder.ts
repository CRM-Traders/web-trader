"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";

interface MarketOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: number;
  quantity: number;
}

export const placeMarketOrder = async (orderRequest: MarketOrderRequest) => {
  const { tradingAccountId, symbol, side, quantity } = orderRequest;

  if (!tradingAccountId || !symbol || side === undefined || !quantity) {
    return {
      success: false,
      error: "Missing required fields",
      data: null,
      statusCode: 400,
    };
  }

  const marketOrderData = {
    ...orderRequest,
    type: 1,
  };

  return apiFetcher<string>("traiding/api/Trading/order/market", {
    method: "POST",
    body: marketOrderData,
    fallbackErrorMessages: {
      400: "Invalid order data provided",
      401: "Authentication required to place orders",
      403: "Access denied to place orders",
      409: "Order placement conflict",
      500: "Order placement service temporarily unavailable",
    },
  });
};
