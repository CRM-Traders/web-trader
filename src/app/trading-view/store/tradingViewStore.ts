"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useState, useEffect } from "react"
import {
  fetchOrders,
  fetchLimitOrders,
  fetchMarketOrders,
  fetchWalletBalances,
  placeLimitOrder,
  placeMarketOrder,
} from "@/app/api/trading"
import type { Order, WalletDto, LimitOrderRequest, MarketOrderRequest } from "@/app/api/types/trading"

// Store-specific interfaces
export interface MarketData {
  symbol: string
  lastPrice: string
  priceChangePercent: number
  volume: string
  high24h: string
  low24h: string
}

export interface WalletBalance {
  id: string
  currency: string
  availableBalance: number
  totalBalance: number
  lockedBalance: number
  usdEquivalent: number
  lastPriceUpdate: string
}

export interface TradingAccount {
  id: string
  name: string
  wallets: WalletBalance[]
}

interface TradingState {
  // User identification
  currentUserId: string | null
  authTimestamp: number | null
  // Market data
  selectedSymbol: string
  availableSymbols: string[]
  marketData: MarketData | null
  // Account
  selectedAccount: TradingAccount | null
  accounts: TradingAccount[]
  // Orders
  openOrders: Order[]
  orderHistory: Order[]
  tradeHistory: Order[]
  limitOrders: Order[]
  marketOrders: Order[]
  // Chart settings
  chartTimeframe: string
  chartType: "candles" | "line" | "bars" | "area"
  chartIndicators: string[]
  // Wallet balances
  walletBalances: WalletBalance[]
  // Loading states
  isLoadingOrders: boolean
  isLoadingWallets: boolean
  isPlacingOrder: boolean
  // Actions
  setCurrentUserId: (userId: string | null) => void
  setAuthTimestamp: (timestamp: number | null) => void
  setSelectedSymbol: (symbol: string) => void
  setAvailableSymbols: (symbols: string[]) => void
  setMarketData: (data: MarketData) => void
  setSelectedAccount: (account: TradingAccount | null) => void
  setAccounts: (accounts: TradingAccount[]) => void
  setOpenOrders: (orders: Order[]) => void
  setOrderHistory: (orders: Order[]) => void
  setTradeHistory: (orders: Order[]) => void
  setLimitOrders: (orders: Order[]) => void
  setMarketOrders: (orders: Order[]) => void
  setChartTimeframe: (timeframe: string) => void
  setChartType: (type: "candles" | "line" | "bars" | "area") => void
  setChartIndicators: (indicators: string[]) => void
  setWalletBalances: (balances: WalletBalance[]) => void
  updateWalletBalance: (currency: string, balance: Partial<WalletBalance>) => void
  // Async actions
  loadOrders: () => Promise<void>
  loadLimitOrders: () => Promise<void>
  loadMarketOrders: () => Promise<void>
  loadWalletBalances: () => Promise<void>
  placeOrder: (orderData: {
    symbol: string
    side: "BUY" | "SELL"
    type: "LIMIT" | "MARKET"
    price?: number
    quantity: number
  }) => Promise<boolean>
  // Utility actions
  resetStore: () => void
  clearUserData: () => void
}

// Helper functions
const mapWalletDtoToWalletBalance = (wallet: WalletDto): WalletBalance => ({
  id: wallet.id,
  currency: wallet.currency,
  availableBalance: wallet.availableBalance,
  totalBalance: wallet.totalBalance,
  lockedBalance: wallet.lockedBalance,
  usdEquivalent: wallet.usdEquivalent,
  lastPriceUpdate: wallet.lastPriceUpdate,
})

const isOrderOpen = (status: string): boolean => {
  return status === "PENDING" || status === "PARTIALLY_FILLED"
}

const isOrderCompleted = (status: string): boolean => {
  return status === "FILLED" || status === "CANCELLED" || status === "REJECTED"
}

import type { OrderSide } from "@/app/api/types/trading"

const sideToOrderSide = (side: "BUY" | "SELL"): OrderSide => {
  return side === "BUY" ? 1 : 2
}

// Helper function to safely extract error information
const getErrorInfo = (response: any) => {
  const statusCode = response?.statusCode || response?.status || "unknown"
  const message = response?.message || response?.error || response?.statusText || "Unknown error"
  return { statusCode, message }
}

// Get user ID and auth timestamp from cookies
const getCurrentUserInfo = (): {
  userId: string | null
  authTimestamp: number | null
} => {
  if (typeof window === "undefined") return { userId: null, authTimestamp: null }

  const authTimestampCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("auth_timestamp="))
  const authTimestamp = authTimestampCookie ? Number.parseInt(authTimestampCookie.split("=")[1]) : null

  const userCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("user_info="))

  if (userCookie) {
    const userInfoStr = userCookie.split("=")[1]
    const userInfo = JSON.parse(decodeURIComponent(userInfoStr))
    return {
      userId: userInfo.id || userInfo.userId || null,
      authTimestamp,
    }
  }

  const sessionCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("session="))

  if (sessionCookie) {
    const sessionValue = sessionCookie.split("=")[1]
    const sessionData = JSON.parse(decodeURIComponent(sessionValue))
    return {
      userId: sessionData.user?.id || null,
      authTimestamp,
    }
  }

  return { userId: null, authTimestamp: null }
}

// Generate storage key based on current user
const getStorageKey = (userId: string | null): string => {
  if (!userId) return "trading-store-anonymous"
  return `trading-store-${userId}`
}

// Create store with user-specific persistence
export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      // Default values
      currentUserId: null,
      authTimestamp: null,
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
      isLoadingOrders: false,
      isLoadingWallets: false,
      isPlacingOrder: false,

      // Basic setters
      setCurrentUserId: (userId) => {
        const currentState = get()
        if (currentState.currentUserId !== userId) {
          console.log("🔄 User changed, clearing user-specific data:", {
            from: currentState.currentUserId,
            to: userId,
          })
          get().clearUserData()
        }
        set({ currentUserId: userId })
      },

      setAuthTimestamp: (timestamp) => {
        const currentState = get()
        if (currentState.authTimestamp && timestamp && currentState.authTimestamp !== timestamp) {
          console.log("🔄 Auth timestamp changed, clearing user data:", {
            from: currentState.authTimestamp,
            to: timestamp,
          })
          get().clearUserData()
        }
        set({ authTimestamp: timestamp })
      },

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
            wallet.currency === currency ? { ...wallet, ...updates } : wallet,
          ),
        })),

      clearUserData: () => {
        console.log("🧹 Clearing all user-specific data from store")
        set({
          selectedAccount: null,
          accounts: [],
          openOrders: [],
          orderHistory: [],
          tradeHistory: [],
          limitOrders: [],
          marketOrders: [],
          walletBalances: [],
          isLoadingOrders: false,
          isLoadingWallets: false,
          isPlacingOrder: false,
        })
      },

      // Async actions
      loadOrders: async () => {
        const { selectedAccount, selectedSymbol } = get()
        if (!selectedAccount?.id) return

        set({ isLoadingOrders: true })

        try {
          const response = await fetchOrders({
            tradingAccountId: selectedAccount.id,
            symbol: selectedSymbol,
            pageIndex: 1,
            pageSize: 100,
          })

          if (response.success && response.data) {
            const orders = response.data
            const openOrders = orders.filter((order: any) => isOrderOpen(order.status))
            const completedOrders = orders.filter((order: any) => isOrderCompleted(order.status))
            const tradeHistory = completedOrders.filter((order: any) => order.status === "FILLED")

            set({
              openOrders,
              orderHistory: completedOrders,
              tradeHistory,
            })
          } else {
            const { statusCode, message } = getErrorInfo(response)
            console.error("Failed to load orders:", { statusCode, message })
          }
        } catch (error) {
          console.error("Error loading orders:", error)
        } finally {
          set({ isLoadingOrders: false })
        }
      },

      loadLimitOrders: async () => {
        const { selectedAccount, selectedSymbol } = get()
        if (!selectedAccount?.id) return

        set({ isLoadingOrders: true })

        try {
          const response = await fetchLimitOrders({
            tradingAccountId: selectedAccount.id,
            symbol: selectedSymbol,
            pageIndex: 1,
            pageSize: 100,
          })

          if (response.success && response.data) {
            set({ limitOrders: response.data })
          } else {
            const { statusCode, message } = getErrorInfo(response)
            console.error("Failed to load limit orders:", { statusCode, message })
          }
        } catch (error) {
          console.error("Error loading limit orders:", error)
        } finally {
          set({ isLoadingOrders: false })
        }
      },

      loadMarketOrders: async () => {
        const { selectedAccount, selectedSymbol } = get()
        if (!selectedAccount?.id) return

        set({ isLoadingOrders: true })

        try {
          const response = await fetchMarketOrders({
            tradingAccountId: selectedAccount.id,
            symbol: selectedSymbol,
            pageIndex: 1,
            pageSize: 100,
          })

          if (response.success && response.data) {
            set({ marketOrders: response.data })
          } else {
            const { statusCode, message } = getErrorInfo(response)
            console.error("Failed to load market orders:", { statusCode, message })
          }
        } catch (error) {
          console.error("Error loading market orders:", error)
        } finally {
          set({ isLoadingOrders: false })
        }
      },

      loadWalletBalances: async () => {
        const { selectedAccount } = get()
        if (!selectedAccount?.id) return

        set({ isLoadingWallets: true })

        try {
          const response = await fetchWalletBalances(selectedAccount.id)

          if (response.success && response.data) {
            const walletBalances = response.data.map(mapWalletDtoToWalletBalance)
            set({ walletBalances })
          } else {
            const { statusCode, message } = getErrorInfo(response)
            console.error("Failed to load wallet balances:", { statusCode, message })
          }
        } catch (error) {
          console.error("Error loading wallet balances:", error)
        } finally {
          set({ isLoadingWallets: false })
        }
      },

      placeOrder: async (orderData) => {
        const { selectedAccount, walletBalances, loadWalletBalances, loadOrders } = get()

        if (!selectedAccount?.id) {
          console.error("No trading account selected")
          return false
        }

        set({ isPlacingOrder: true })

        try {
          // Pre-flight balance check
          const [baseCurrency, quoteCurrency] = orderData.symbol.split("/")

          if (orderData.side === "BUY") {
            const quoteWallet = walletBalances.find((w) => w.currency === quoteCurrency)
            const estimatedTotal = orderData.price ? orderData.price * orderData.quantity : orderData.quantity

            if (!quoteWallet || quoteWallet.availableBalance < estimatedTotal) {
              console.error(`Insufficient ${quoteCurrency} balance`)
              set({ isPlacingOrder: false })
              return false
            }
          } else {
            const baseWallet = walletBalances.find((w) => w.currency === baseCurrency)

            if (!baseWallet || baseWallet.availableBalance < orderData.quantity) {
              console.error(`Insufficient ${baseCurrency} balance`)
              set({ isPlacingOrder: false })
              return false
            }
          }

          let response

          if (orderData.type === "LIMIT") {
            if (!orderData.price) {
              console.error("Price is required for limit orders")
              set({ isPlacingOrder: false })
              return false
            }

            const limitOrderRequest: LimitOrderRequest = {
              tradingAccountId: selectedAccount.id,
              symbol: orderData.symbol,
              side: sideToOrderSide(orderData.side),
              quantity: orderData.quantity,
              price: orderData.price,
            }

            response = await placeLimitOrder(limitOrderRequest)
          } else {
            const marketOrderRequest: MarketOrderRequest = {
              tradingAccountId: selectedAccount.id,
              symbol: orderData.symbol,
              side: sideToOrderSide(orderData.side),
              quantity: orderData.quantity,
            }

            response = await placeMarketOrder(marketOrderRequest)
          }

          if (response.success) {
            // Reload data to get updated state
            await Promise.all([loadWalletBalances(), loadOrders()])
            set({ isPlacingOrder: false })
            return true
          } else {
            const { statusCode, message } = getErrorInfo(response)
            console.error("Failed to place order:", {
              statusCode,
              message,
              fullResponse: response,
            })
            set({ isPlacingOrder: false })
            return false
          }
        } catch (error) {
          console.error("Error placing order:", error)
          set({ isPlacingOrder: false })
          return false
        }
      },

      // Reset store to initial state
      resetStore: () => {
        console.log("🔄 Resetting entire store")
        set({
          currentUserId: null,
          authTimestamp: null,
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
          isLoadingOrders: false,
          isLoadingWallets: false,
          isPlacingOrder: false,
        })
      },
    }),
    {
      name: "trading-store",
      partialize: (state) => {
        // Persist non-user-specific settings and account selection
        return {
          selectedSymbol: state.selectedSymbol,
          chartTimeframe: state.chartTimeframe,
          chartType: state.chartType,
          chartIndicators: state.chartIndicators,
          selectedAccount: state.selectedAccount,
          accounts: state.accounts,
        }
      },
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null
          const { userId } = getCurrentUserInfo()
          const key = getStorageKey(userId)
          const item = localStorage.getItem(key)
          return item ? JSON.parse(item) : null
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return
          const { userId } = getCurrentUserInfo()
          const key = getStorageKey(userId)
          localStorage.setItem(key, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return
          const { userId } = getCurrentUserInfo()
          const key = getStorageKey(userId)
          localStorage.removeItem(key)
        },
      },
    },
  ),
)

// Hook to initialize user context in the store
export function useInitializeUser() {
  const { setCurrentUserId, setAuthTimestamp, currentUserId, authTimestamp } = useTradingStore()

  useEffect(() => {
    const { userId, authTimestamp: newAuthTimestamp } = getCurrentUserInfo()

    console.log("🔍 Initializing user in trading store:", {
      userId,
      currentUserId,
      newAuthTimestamp,
      currentAuthTimestamp: authTimestamp,
      timestamp: new Date().toISOString(),
    })

    // Set auth timestamp first (this will clear data if changed)
    if (newAuthTimestamp !== authTimestamp) {
      setAuthTimestamp(newAuthTimestamp)
    }

    // Then set user ID
    if (userId !== currentUserId) {
      setCurrentUserId(userId)
    }
  }, [setCurrentUserId, setAuthTimestamp, currentUserId, authTimestamp])

  // Check for changes periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const { userId, authTimestamp: newAuthTimestamp } = getCurrentUserInfo()

      if (newAuthTimestamp !== authTimestamp) {
        console.log("🔄 Auth timestamp change detected:", {
          from: authTimestamp,
          to: newAuthTimestamp,
        })
        setAuthTimestamp(newAuthTimestamp)
      }

      if (userId && userId !== currentUserId) {
        console.log("🔄 User change detected:", {
          from: currentUserId,
          to: userId,
        })
        setCurrentUserId(userId)
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [currentUserId, authTimestamp, setCurrentUserId, setAuthTimestamp])
}

// Function to clear all trading store data from localStorage
export const clearAllTradingStoreData = () => {
  if (typeof window === "undefined") return

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("trading-store")) {
      localStorage.removeItem(key)
    }
  })
}

// Hook to check if store has hydrated
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  return hasHydrated
}
