"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import { fetchWalletBalances, placeLimitOrder, placeMarketOrder, fetchOrders, fetchLimitOrders, fetchMarketOrders } from "@/app/api/trading-accounts/actions";

// Types
export interface MarketData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: number;
  volume: string;
  high24h: string;
  low24h: string;
}

// Add these interfaces after the existing ones
export interface WalletBalance {
  id: string;
  currency: string;
  availableBalance: number;
  totalBalance: number;
  lockedBalance: number;
  usdEquivalent: number;
  lastPriceUpdate: string;
}

export interface TradingAccount {
  id: string;
  name: string;
  wallets: WalletBalance[];
}

// Define the Order interface
interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price?: number;
  quantity: number;
  status: number; // 1=Pending, 2=PartiallyFilled, 3=Filled, 4=Cancelled, 5=Rejected
  createdAt: string;
}

// Update the TradingState interface to include:
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
  limitOrders: Order[];
  marketOrders: Order[];

  // Chart settings
  chartTimeframe: string;
  chartType: "candles" | "line" | "bars" | "area";
  chartIndicators: string[];

  // Wallet balances
  walletBalances: WalletBalance[];

  // Actions
  setSelectedSymbol: (symbol: string) => void;
  setAvailableSymbols: (symbols: string[]) => void;
  setMarketData: (data: MarketData) => void;
  setSelectedAccount: (account: TradingAccount | null) => void;
  setAccounts: (accounts: TradingAccount[]) => void;
  setOpenOrders: (orders: Order[]) => void;
  setOrderHistory: (orders: Order[]) => void;
  setTradeHistory: (orders: Order[]) => void;
  setLimitOrders: (orders: Order[]) => void;
  setMarketOrders: (orders: Order[]) => void;
  setChartTimeframe: (timeframe: string) => void;
  setChartType: (type: "candles" | "line" | "bars" | "area") => void;
  setChartIndicators: (indicators: string[]) => void;
  setWalletBalances: (balances: WalletBalance[]) => void;
  updateWalletBalance: (
    currency: string,
    balance: Partial<WalletBalance>
  ) => void;
  loadOrders: () => Promise<void>;
  loadLimitOrders: () => Promise<void>;
  loadMarketOrders: () => Promise<void>;
  loadWalletBalances: () => Promise<void>;
  resetStore: () => void;

  placeOrder: (orderData: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    price?: number;
    quantity: number;
  }) => Promise<boolean>;
}

// Helper function to convert side to number
const sideToNumber = (side: "BUY" | "SELL"): number => {
  return side === "BUY" ? 1 : 2; // 1 for BUY, 2 for SELL (matching C# OrderSide enum)
};

// Helper function to convert type number to string
const typeToString = (type: number): "LIMIT" | "MARKET" => {
  return type === 2 ? "LIMIT" : "MARKET"; // 2 for LIMIT, 1 for MARKET
};

// Helper function to convert status number to string
const statusToString = (status: number): string => {
  switch (status) {
    case 1: return "PENDING";
    case 2: return "PARTIALLY_FILLED";
    case 3: return "FILLED";
    case 4: return "CANCELLED";
    case 5: return "REJECTED";
    default: return "UNKNOWN";
  }
};

// Helper function to check if order is open/pending
const isOrderOpen = (status: number): boolean => {
  return status === 1 || status === 2; // Pending or PartiallyFilled
};

// Helper function to check if order is completed
const isOrderCompleted = (status: number): boolean => {
  return status === 3 || status === 4 || status === 5; // Filled, Cancelled, or Rejected
};

// Helper function to get user-specific storage key
const getStorageKey = (): string => {
  if (typeof window === "undefined") return "trading-store";
  
  try {
    const cookies = document.cookie.split(";");
    const userCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("user_info=")
    );

    if (userCookie) {
      const userInfoStr = userCookie.split("=")[1];
      const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
      return `trading-store-${userInfo.id}`;
    }
  } catch (error) {
    console.error("Error getting user-specific storage key:", error);
  }
  
  return "trading-store";
};

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
      limitOrders: [],
      marketOrders: [],
      chartTimeframe: "1D",
      chartType: "candles",
      chartIndicators: [],
      walletBalances: [],

      // Actions
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      setAvailableSymbols: (symbols) => set({ availableSymbols: symbols }),
      setMarketData: (data) => set({ marketData: data }),
      setSelectedAccount: (account) => set({ selectedAccount: account }),
      setAccounts: (accounts) => set({ accounts }),
      setOpenOrders: (orders) => set({ openOrders: orders }),
      setOrderHistory: (orders) => set({ orderHistory: orders }),
      setTradeHistory: (orders) => set({ tradeHistory: orders }),
      setLimitOrders: (orders) => set({ limitOrders: orders }),
      setMarketOrders: (orders) => set({ marketOrders: orders }),
      setChartTimeframe: (timeframe) => set({ chartTimeframe: timeframe }),
      setChartType: (type) => set({ chartType: type }),
      setChartIndicators: (indicators) => set({ chartIndicators: indicators }),
      setWalletBalances: (balances) => set({ walletBalances: balances }),

      updateWalletBalance: (currency, updates) =>
        set((state) => ({
          walletBalances: state.walletBalances.map((wallet) =>
            wallet.currency === currency ? { ...wallet, ...updates } : wallet
          ),
        })),

      // Reset store to initial state (useful when switching users)
      resetStore: () => set({
        selectedSymbol: "BTC/USDT",
        availableSymbols: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"],
        marketData: null,
        selectedAccount: null,
        accounts: [],
        openOrders: [],
        orderHistory: [],
        tradeHistory: [],
        limitOrders: [],
        marketOrders: [],
        chartTimeframe: "1D",
        chartType: "candles",
        chartIndicators: [],
        walletBalances: [],
      }),

      // Load orders from API
      loadOrders: async () => {
        try {
          const { selectedAccount, selectedSymbol } = get();
          if (!selectedAccount?.id) return;

          // Fetch all orders for the selected account
          const ordersResponse = await fetchOrders({
            tradingAccountId: selectedAccount.id,
            symbol: selectedSymbol,
            pageIndex: 1,
            pageSize: 100
          });

          if (ordersResponse.success && ordersResponse.data) {
            console.log("Orders response in store:", ordersResponse.data);
            
            // Convert the orders to match our interface
            const orders: Order[] = ordersResponse.data.map(order => ({
              id: order.id,
              symbol: order.symbol,
              side: order.side === 1 ? "BUY" : "SELL", // 1 for BUY, 2 for SELL
              type: typeToString(order.type),
              price: order.price,
              quantity: order.quantity,
              status: order.status,
              createdAt: order.createdAt,
            }));

            console.log("Mapped orders:", orders);

            // Separate open orders from completed orders
            const openOrders = orders.filter(order => isOrderOpen(order.status));
            const completedOrders = orders.filter(order => isOrderCompleted(order.status));

            console.log("Open orders:", openOrders);
            console.log("Completed orders:", completedOrders);

            set({
              openOrders,
              orderHistory: completedOrders,
              tradeHistory: completedOrders.filter(order => order.status === 3), // FILLED = 3
            });
          } else {
            console.error("Failed to load orders:", ordersResponse.error);
          }
        } catch (error) {
          console.error("Failed to load orders:", error);
        }
      },

      // Load limit orders from API
      loadLimitOrders: async () => {
        try {
          const { selectedAccount, selectedSymbol } = get();
          if (!selectedAccount?.id) return;

          // Fetch limit orders for the selected account
          const ordersResponse = await fetchLimitOrders({
            tradingAccountId: selectedAccount.id,
            symbol: selectedSymbol,
            pageIndex: 1,
            pageSize: 100
          });

          if (ordersResponse.success && ordersResponse.data) {
            console.log("Limit orders response in store:", ordersResponse.data);
            
            // Convert the orders to match our interface
            const orders: Order[] = ordersResponse.data.map(order => ({
              id: order.id,
              symbol: order.symbol,
              side: order.side === 1 ? "BUY" : "SELL", // 1 for BUY, 2 for SELL
              type: typeToString(order.type),
              price: order.price,
              quantity: order.quantity,
              status: order.status,
              createdAt: order.createdAt,
            }));

            console.log("Mapped limit orders:", orders);
            set({ limitOrders: orders });
          } else {
            console.error("Failed to load limit orders:", ordersResponse.error);
          }
        } catch (error) {
          console.error("Failed to load limit orders:", error);
        }
      },

      // Load market orders from API
      loadMarketOrders: async () => {
        try {
          const { selectedAccount, selectedSymbol } = get();
          if (!selectedAccount?.id) return;

          // Fetch market orders for the selected account
          const ordersResponse = await fetchMarketOrders({
            tradingAccountId: selectedAccount.id,
            symbol: selectedSymbol,
            pageIndex: 1,
            pageSize: 100
          });

          if (ordersResponse.success && ordersResponse.data) {
            console.log("Market orders response in store:", ordersResponse.data);
            
            // Convert the orders to match our interface
            const orders: Order[] = ordersResponse.data.map(order => ({
              id: order.id,
              symbol: order.symbol,
              side: order.side === 1 ? "BUY" : "SELL", // 1 for BUY, 2 for SELL
              type: typeToString(order.type),
              price: order.price,
              quantity: order.quantity,
              status: order.status,
              createdAt: order.createdAt,
            }));

            console.log("Mapped market orders:", orders);
            set({ marketOrders: orders });
          } else {
            console.error("Failed to load market orders:", ordersResponse.error);
          }
        } catch (error) {
          console.error("Failed to load market orders:", error);
        }
      },

      loadWalletBalances: async () => {
        try {
          const { selectedAccount } = get();
          if (!selectedAccount?.id) return;

          // Call the API to fetch wallet balances
          const response = await fetchWalletBalances(selectedAccount.id);
          
          if (response.success && response.data) {
            set({ walletBalances: response.data });
          } else {
            console.error("Failed to load wallet balances:", response.error);
          }
        } catch (error) {
          console.error("Failed to load wallet balances:", error);
        }
      },

      placeOrder: async (orderData) => {
        try {
          const {
            selectedAccount,
            walletBalances,
            setWalletBalances,
            setOpenOrders,
            openOrders,
            loadWalletBalances,
          } = get();
          
          if (!selectedAccount?.id) {
            throw new Error("No trading account selected");
          }

          const [baseCurrency, quoteCurrency] = orderData.symbol.split("/");

          // Pre-flight balance check
          if (orderData.side === "BUY") {
            const quoteWallet = walletBalances.find(
              (w) => w.currency === quoteCurrency
            );
            const estimatedTotal = orderData.price 
              ? orderData.price * orderData.quantity 
              : orderData.quantity; // For market orders, quantity might be in quote currency
            
            if (!quoteWallet || quoteWallet.availableBalance < estimatedTotal) {
              throw new Error(`Insufficient ${quoteCurrency} balance`);
            }
          } else {
            const baseWallet = walletBalances.find(
              (w) => w.currency === baseCurrency
            );
            if (
              !baseWallet ||
              baseWallet.availableBalance < orderData.quantity
            ) {
              throw new Error(`Insufficient ${baseCurrency} balance`);
            }
          }

          // Prepare API request data
          let response;
          
          // Call the appropriate API function
          if (orderData.type === "LIMIT") {
            if (!orderData.price) {
              throw new Error("Price is required for limit orders");
            }
            const limitOrderData = {
              tradingAccountId: selectedAccount.id,
              symbol: orderData.symbol,
              side: sideToNumber(orderData.side),
              quantity: orderData.quantity,
              price: orderData.price,
              type: 2 // LIMIT enum value
            };
            console.log("Sending LIMIT order:", limitOrderData);
            response = await placeLimitOrder(limitOrderData);
          } else {
            const marketOrderData = {
              tradingAccountId: selectedAccount.id,
              symbol: orderData.symbol,
              side: sideToNumber(orderData.side),
              quantity: orderData.quantity,
              type: 1 // MARKET enum value
            };
            console.log("Sending MARKET order:", marketOrderData);
            response = await placeMarketOrder(marketOrderData);
          }

          if (!response.success) {
            throw new Error(response.error || "Failed to place order");
          }

          // Create new order object for local state
          const newOrder: Order = {
            id: response.data?.id || `order_${Date.now()}`,
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            price: orderData.price,
            quantity: orderData.quantity,
            status: response.data?.status || "OPEN",
            createdAt: response.data?.createdAt || new Date().toISOString(),
          };

          // Update local state
          setOpenOrders([...openOrders, newOrder]);

          // Reload wallet balances to get updated amounts
          await loadWalletBalances();

          // Reload orders to get the latest order status
          await get().loadOrders();

          return true;
        } catch (error) {
          console.error("Failed to place order:", error);
          throw error;
        }
      },
    }),
    {
      name: getStorageKey(),
    }
  )
);

// Function to clear all trading store data from localStorage
export const clearAllTradingStoreData = () => {
  if (typeof window === "undefined") return;
  
  // Clear all localStorage keys that start with "trading-store"
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("trading-store")) {
      localStorage.removeItem(key);
    }
  });
};

// Hook to check if store has hydrated
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}