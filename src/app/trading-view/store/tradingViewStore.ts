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

// Add these interfaces after the existing ones
export interface WalletBalance {
  currency: string;
  availableBalance: number;
  totalBalance: number;
  lockedBalance: number;
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
  setChartTimeframe: (timeframe: string) => void;
  setChartType: (type: "candles" | "line" | "bars" | "area") => void;
  setChartIndicators: (indicators: string[]) => void;
  setWalletBalances: (balances: WalletBalance[]) => void;
  updateWalletBalance: (
    currency: string,
    balance: Partial<WalletBalance>
  ) => void;
  loadOrders: () => Promise<void>;
  loadWalletBalances: () => Promise<void>;
  placeOrder: (orderData: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    price?: number;
    quantity: number;
  }) => Promise<boolean>;
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

      loadWalletBalances: async () => {
        try {
          const { selectedAccount } = get();
          if (!selectedAccount?.id) return;

          // Mock wallet data - replace with your actual API call
          const mockWallets: WalletBalance[] = [
            {
              currency: "BTC",
              availableBalance: 1.5,
              totalBalance: 1.5,
              lockedBalance: 0,
            },
            {
              currency: "USDT",
              availableBalance: 10000,
              totalBalance: 10000,
              lockedBalance: 0,
            },
            {
              currency: "ETH",
              availableBalance: 5.2,
              totalBalance: 5.2,
              lockedBalance: 0,
            },
            {
              currency: "SOL",
              availableBalance: 100,
              totalBalance: 100,
              lockedBalance: 0,
            },
          ];

          set({ walletBalances: mockWallets });
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
          } = get();
          if (!selectedAccount?.id) return false;

          const [baseCurrency, quoteCurrency] = orderData.symbol.split("/");

          // Calculate order total
          const orderPrice =
            orderData.type === "MARKET" ? 50000 : orderData.price || 0; // Mock market price
          const orderTotal = orderPrice * orderData.quantity;

          // Check balance
          if (orderData.side === "BUY") {
            const quoteWallet = walletBalances.find(
              (w) => w.currency === quoteCurrency
            );
            if (!quoteWallet || quoteWallet.availableBalance < orderTotal) {
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

          // Create new order
          const newOrder: Order = {
            id: `order_${Date.now()}`,
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            price: orderPrice,
            quantity: orderData.quantity,
            status: "OPEN",
            createdAt: new Date().toISOString(),
          };

          // Update balances (lock funds)
          const updatedBalances = walletBalances.map((wallet) => {
            if (orderData.side === "BUY" && wallet.currency === quoteCurrency) {
              return {
                ...wallet,
                availableBalance: wallet.availableBalance - orderTotal,
                lockedBalance: wallet.lockedBalance + orderTotal,
              };
            } else if (
              orderData.side === "SELL" &&
              wallet.currency === baseCurrency
            ) {
              return {
                ...wallet,
                availableBalance: wallet.availableBalance - orderData.quantity,
                lockedBalance: wallet.lockedBalance + orderData.quantity,
              };
            }
            return wallet;
          });

          // Update state
          setWalletBalances(updatedBalances);
          setOpenOrders([...openOrders, newOrder]);

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
