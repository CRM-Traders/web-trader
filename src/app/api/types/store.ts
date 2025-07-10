import type {
  TradingAccount,
  WalletBalance,
  Order,
  MarketData,
} from "./trading";

export interface TradingState {
  // User identification
  currentUserId: string | null;
  authTimestamp: number | null;

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

  // Loading states
  isLoading: boolean;
  isLoadingOrders: boolean;
  isLoadingWallets: boolean;
  isLoadingAccounts: boolean;

  // Error states
  error: string | null;
  orderError: string | null;
  walletError: string | null;
  accountError: string | null;
}

export interface TradingActions {
  // User actions
  setCurrentUserId: (userId: string | null) => void;
  setAuthTimestamp: (timestamp: number | null) => void;

  // Market actions
  setSelectedSymbol: (symbol: string) => void;
  setAvailableSymbols: (symbols: string[]) => void;
  setMarketData: (data: MarketData) => void;

  // Account actions
  setSelectedAccount: (account: TradingAccount | null) => void;
  setAccounts: (accounts: TradingAccount[]) => void;

  // Order actions
  setOpenOrders: (orders: Order[]) => void;
  setOrderHistory: (orders: Order[]) => void;
  setTradeHistory: (orders: Order[]) => void;
  setLimitOrders: (orders: Order[]) => void;
  setMarketOrders: (orders: Order[]) => void;

  // Chart actions
  setChartTimeframe: (timeframe: string) => void;
  setChartType: (type: "candles" | "line" | "bars" | "area") => void;
  setChartIndicators: (indicators: string[]) => void;

  // Wallet actions
  setWalletBalances: (balances: WalletBalance[]) => void;
  updateWalletBalance: (
    currency: string,
    balance: Partial<WalletBalance>
  ) => void;

  // Loading actions
  setLoading: (loading: boolean) => void;
  setLoadingOrders: (loading: boolean) => void;
  setLoadingWallets: (loading: boolean) => void;
  setLoadingAccounts: (loading: boolean) => void;

  // Error actions
  setError: (error: string | null) => void;
  setOrderError: (error: string | null) => void;
  setWalletError: (error: string | null) => void;
  setAccountError: (error: string | null) => void;

  // Utility actions
  resetStore: () => void;
  clearUserData: () => void;

  // Async actions
  loadOrders: () => Promise<void>;
  loadWalletBalances: () => Promise<void>;
  loadTradingAccounts: () => Promise<void>;
}

export type TradingStore = TradingState & TradingActions;
