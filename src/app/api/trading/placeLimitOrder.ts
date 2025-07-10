"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";

interface LimitOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: number; // 1 for BUY, 2 for SELL
  quantity: number;
  price: number;
}

export const placeLimitOrder = async (orderRequest: LimitOrderRequest) => {
  const { tradingAccountId, symbol, side, quantity, price } = orderRequest;

  if (
    !tradingAccountId ||
    !symbol ||
    side === undefined ||
    !quantity ||
    !price
  ) {
    return {
      success: false,
      error: "Missing required fields",
      data: null,
      statusCode: 400,
    };
  }

  const limitOrderData = {
    ...orderRequest,
    type: 2, // LIMIT enum value
  };

  return apiFetcher<string>("traiding/api/Trading/order/limit", {
    method: "POST",
    body: limitOrderData,
    fallbackErrorMessages: {
      400: "Invalid order data provided",
      401: "Authentication required to place orders",
      403: "Access denied to place orders",
      409: "Order placement conflict",
      500: "Order placement service temporarily unavailable",
    },
  });
};
