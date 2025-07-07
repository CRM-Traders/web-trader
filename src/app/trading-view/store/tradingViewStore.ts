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
  status: string;
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
  return side === "BUY" ? 1 : -1;
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
            // Convert the orders to match our interface
            const orders: Order[] = ordersResponse.data.map(order => ({
              id: order.id,
              symbol: order.symbol,
              side: order.side === 1 ? "BUY" : "SELL",
              type: order.type as "LIMIT" | "MARKET",
              price: order.price,
              quantity: order.quantity,
              status: order.status,
              createdAt: order.createdAt,
            }));

            // Separate open orders from completed orders
            const openOrders = orders.filter(order => 
              order.status === "OPEN" || order.status === "PENDING" || order.status === "PARTIALLY_FILLED"
            );
            const completedOrders = orders.filter(order => 
              order.status === "FILLED" || order.status === "CANCELLED" || order.status === "REJECTED"
            );

            set({
              openOrders,
              orderHistory: completedOrders,
              tradeHistory: completedOrders.filter(order => order.status === "FILLED"),
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
            // Convert the orders to match our interface
            const orders: Order[] = ordersResponse.data.map(order => ({
              id: order.id,
              symbol: order.symbol,
              side: order.side === 1 ? "BUY" : "SELL",
              type: order.type as "LIMIT" | "MARKET",
              price: order.price,
              quantity: order.quantity,
              status: order.status,
              createdAt: order.createdAt,
            }));

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
            // Convert the orders to match our interface
            const orders: Order[] = ordersResponse.data.map(order => ({
              id: order.id,
              symbol: order.symbol,
              side: order.side === 1 ? "BUY" : "SELL",
              type: order.type as "LIMIT" | "MARKET",
              price: order.price,
              quantity: order.quantity,
              status: order.status,
              createdAt: order.createdAt,
            }));

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
          const apiData = {
            tradingAccountId: selectedAccount.id,
            symbol: orderData.symbol,
            side: sideToNumber(orderData.side),
            quantity: orderData.quantity,
            ...(orderData.type === "LIMIT" && { price: orderData.price })
          };

          let response;
          
          // Call the appropriate API function
          if (orderData.type === "LIMIT") {
            response = await placeLimitOrder(apiData as any);
          } else {
            response = await placeMarketOrder({
              tradingAccountId: apiData.tradingAccountId,
              symbol: apiData.symbol,
              side: apiData.side,
              quantity: apiData.quantity
            });
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