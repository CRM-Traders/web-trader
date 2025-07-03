"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";

// Types
export interface MarketData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: number;
  volume: string;
  high24h: string;
  low24h: string;
}

export interface TradingAccount {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: number;
  quantity: number;
  status: string;
  createdAt: string;
}

interface TradingState {
  // Market data
  selectedSymbol: string;
  availableSymbols: string[];
  marketData: MarketData | null;

  // Account
  selectedAccount: TradingAccount | null;
  accounts: TradingAccount[];

  // Orders
  openOrders: Order[];
  orderHistory: Order[];
  tradeHistory: Order[];

  // Chart settings
  chartTimeframe: string;
  chartType: "candles" | "line" | "bars" | "area";
  chartIndicators: string[];

  // Actions
  setSelectedSymbol: (symbol: string) => void;
  setAvailableSymbols: (symbols: string[]) => void;
  setMarketData: (data: MarketData) => void;
  setSelectedAccount: (account: TradingAccount | null) => void;
  setAccounts: (accounts: TradingAccount[]) => void;
  setOpenOrders: (orders: Order[]) => void;
  setOrderHistory: (orders: Order[]) => void;
  setTradeHistory: (orders: Order[]) => void;
  setChartTimeframe: (timeframe: string) => void;
  setChartType: (type: "candles" | "line" | "bars" | "area") => void;
  setChartIndicators: (indicators: string[]) => void;
  loadOrders: () => Promise<void>;
}

// Create store with persistence
export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      // Default values
      selectedSymbol: "BTC/USDT",
      availableSymbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"],
      marketData: null,
      selectedAccount: null,
      accounts: [],
      openOrders: [],
      orderHistory: [],
      tradeHistory: [],
      chartTimeframe: "1D",
      chartType: "candles",
      chartIndicators: [],

      // Actions
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      setAvailableSymbols: (symbols) => set({ availableSymbols: symbols }),
      setMarketData: (data) => set({ marketData: data }),
      setSelectedAccount: (account) => set({ selectedAccount: account }),
      setAccounts: (accounts) => set({ accounts }),
      setOpenOrders: (orders) => set({ openOrders: orders }),
      setOrderHistory: (orders) => set({ orderHistory: orders }),
      setTradeHistory: (orders) => set({ tradeHistory: orders }),
      setChartTimeframe: (timeframe) => set({ chartTimeframe: timeframe }),
      setChartType: (type) => set({ chartType: type }),
      setChartIndicators: (indicators) => set({ chartIndicators: indicators }),

      // Load orders from API
      loadOrders: async () => {
        try {
          const { selectedAccount, selectedSymbol } = get();
          if (!selectedAccount?.id) return;

          // This is a placeholder - replace with your actual API call
          // const ordersResponse = await tradingService.getOrders(selectedAccount.id, selectedSymbol);

          // Simulate API response for demo
          const mockOpenOrders: Order[] = [
            {
              id: "1",
              symbol: selectedSymbol,
              side: "BUY",
              type: "LIMIT",
              price: 30000,
              quantity: 0.1,
              status: "OPEN",
              createdAt: new Date().toISOString(),
            },
          ];

          set({
            openOrders: mockOpenOrders,
            orderHistory: [],
            tradeHistory: [],
          });
        } catch (error) {
          console.error("Failed to load orders:", error);
        }
      },
    }),
    {
      name: "trading-store",
    }
  )
);

// Hook to check if store has hydrated
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
