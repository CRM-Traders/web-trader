"use server";

import { fetchOrders } from "./fetchOrders";

interface FetchOrdersRequest {
  tradingAccountId: string;
  status?: string;
  symbol?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const fetchMarketOrders = async (request: FetchOrdersRequest) => {
  const response = await fetchOrders(request);

  if (response.success && response.data) {
    // Filter for market orders only
    const marketOrders = response.data.filter((order: any) => order.type === 1); // MARKET enum value
    return {
      ...response,
      data: marketOrders,
    };
  }

  return response;
};
