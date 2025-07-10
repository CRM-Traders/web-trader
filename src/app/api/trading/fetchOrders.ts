"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";

interface Order {
  id: string;
  symbol: string;
  side: number;
  type: number;
  price?: number;
  quantity: number;
  status: number;
  createdAt: string;
  updatedAt?: string;
}

interface FetchOrdersRequest {
  tradingAccountId: string;
  status?: string;
  symbol?: string;
  pageIndex?: number;
  pageSize?: number;
}

// Helper function to map API response to frontend format
const mapApiOrderToOrder = (apiOrder: any): Order => {
  // Map orderType to type number
  let type = 1; // Default MARKET
  if (apiOrder.orderType === "Limit") type = 2;

  // Map side to number (1=BUY, 2=SELL)
  let side = 1; // Default BUY
  if (apiOrder.side === "Sell" || apiOrder.side === 2) side = 2;

  // Map status string to number
  let status = 1; // Default Pending
  switch (apiOrder.status) {
    case "Pending":
      status = 1;
      break;
    case "PartiallyFilled":
      status = 2;
      break;
    case "Filled":
      status = 3;
      break;
    case "Cancelled":
      status = 4;
      break;
    case "Rejected":
      status = 5;
      break;
    default:
      status = 1;
  }

  return {
    id: apiOrder.id,
    symbol: apiOrder.tradingPairSymbol,
    side,
    type,
    price: apiOrder.price,
    quantity: apiOrder.quantity,
    status,
    createdAt: apiOrder.createdAt,
  };
};

export const fetchOrders = async (request: FetchOrdersRequest) => {
  const {
    tradingAccountId,
    status,
    symbol,
    pageIndex = 1,
    pageSize = 50,
  } = request;

  if (!tradingAccountId) {
    return {
      success: false,
      error: "Trading account ID is required",
      data: null,
      statusCode: 400,
    };
  }

  const params = new URLSearchParams({
    tradingAccountId: tradingAccountId,
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString(),
    status: status || "",
    symbol: symbol || "",
  });

  const response = await apiFetcher<any>(
    `traiding/api/Trading/orders?${params.toString()}`,
    {
      method: "GET",
      fallbackErrorMessages: {
        401: "Authentication required to access orders",
        403: "Access denied to orders",
        404: "No orders found",
        500: "Orders service temporarily unavailable",
      },
    }
  );

  if (response.success && response.data) {
    const orders = (
      response.data.items ||
      response.data.orders ||
      response.data ||
      []
    ).map(mapApiOrderToOrder);
    return {
      ...response,
      data: orders,
    };
  }

  return response;
};
