"use server";

import { fetchOrders } from "./fetchOrders";

interface FetchOrdersRequest {
  tradingAccountId: string;
  status?: string;
  symbol?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const fetchLimitOrders = async (request: FetchOrdersRequest) => {
  const response = await fetchOrders(request);

  if (response.success && response.data) {
    const limitOrders = response.data.filter((order: any) => order.type === 2);
    return {
      ...response,
      data: limitOrders,
    };
  }

  return response;
};
