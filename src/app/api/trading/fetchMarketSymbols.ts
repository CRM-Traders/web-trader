"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";

export interface FetchMarketSymbolsParams {
  search?: string;
  pageSize?: number;
  pageIndex?: number;
}

export interface MarketSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export const fetchMarketSymbols = async (params?: FetchMarketSymbolsParams) => {
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  
  if (params?.pageSize !== undefined) {
    queryParams.append('pageSize', params.pageSize.toString());
  }
  
  if (params?.pageIndex !== undefined) {
    queryParams.append('pageIndex', params.pageIndex.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `binance/api/Binance/trading-pairs${queryString ? `?${queryString}` : ''}`;

  const response = await apiFetcher<MarketSymbol[]>(endpoint, {
    method: "GET",
    fallbackErrorMessages: {
      401: "Authentication required to access market symbols",
      403: "Access denied to market symbols",
      404: "No market symbols found",
      500: "Market symbols service temporarily unavailable",
    },
  });

  return response;
}; 