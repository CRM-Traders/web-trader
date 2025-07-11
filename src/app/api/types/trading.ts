export interface TradingAccountDto {
  id: string;
  userId: string;
  accountNumber: string;
  displayName: string;
  accountType: string;
  status: string;
  initialBalance: number;
  enableSpotTrading: boolean;
  enableFuturesTrading: boolean;
  maxLeverage: number;
  createdAt: string;
  verifiedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export interface WalletDto {
  id: string;
  currency: string;
  availableBalance: number;
  lockedBalance: number;
  totalBalance: number;
  usdEquivalent: number;
  lastPriceUpdate: string;
}

export interface PortfolioDto {
  tradingAccountId: string;
  totalUsdValue: number;
  holdings: AssetHoldingDto[];
  timestamp: string;
}

export interface AssetHoldingDto {
  currency: string;
  balance: number;
  usdPrice: number;
  usdValue: number;
  percentage: number;
  change24h: number;
}

export interface CreateTicketRequest {
  walletId: string;
  type: TicketType;
  amount: number;
}

export interface TicketDto {
  id: string;
  ticketType: TicketType;
  amount: number;
  walletId: string;
  ticketStatus: TicketStatus;
}

export interface GetTicketsParams {
  tradingAccountId?: string;
  pageIndex?: number;
  pageSize?: number;
}

export enum TicketType {
  Deposit = 0,
  Withdraw = 1,
}

export enum TicketStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Cancelled = 3,
  Failed = 4,
  Rejected = 5,
}

// Trading Order Types
export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  quantity: number;
  status: status;
  createdAt: string;
  updatedAt?: string;
  filledQuantity?: number;
  averagePrice?: number;
  tradingAccountId: string;
}

export enum OrderSide {
  BUY = 1,
  SELL = 2,
}

export enum OrderType {
  MARKET = 1,
  LIMIT = 2,
}

export enum status {
  PENDING = 1,
  PARTIALLY_FILLED = 2,
  FILLED = 3,
  CANCELLED = 4,
  REJECTED = 5,
}

export interface LimitOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
}

export interface MarketOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
}

export interface FetchOrdersRequest {
  tradingAccountId: string;
  status?: number | null;
  symbol?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface CreateTradingAccountRequest {
  displayName: string;
}

export interface SetTradingAccountRequest {
  tradingAccountId: string;
}

// Market Data Types
export interface MarketData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: number;
  volume: string;
  high24h: string;
  low24h: string;
  bid?: string;
  ask?: string;
  timestamp?: string;
}

export interface OrderBookEntry {
  price: string;
  quantity: string;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: string;
}

export interface Trade {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  side: OrderSide;
  timestamp: string;
}

export interface Kline {
  openTime: number;
  closeTime: number;
  symbol: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  trades: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface MarketDataUpdate {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  timestamp: string;
}

export interface OrderBookUpdate {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: string;
}

export interface TradeUpdate {
  symbol: string;
  price: string;
  quantity: string;
  side: OrderSide;
  timestamp: string;
}

// API Response wrapper types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Trading Account related types
export interface TradingAccount {
  id: string;
  name: string;
  wallets: WalletBalance[];
}

export interface WalletBalance {
  id: string;
  currency: string;
  availableBalance: number;
  totalBalance: number;
  lockedBalance: number;
  usdEquivalent: number;
  lastPriceUpdate: string;
}

// Chart and Analysis Types
export interface ChartSettings {
  timeframe: string;
  chartType: "candles" | "line" | "bars" | "area";
  indicators: string[];
}

export interface TechnicalIndicator {
  name: string;
  parameters: Record<string, any>;
  values: number[];
}

export interface ChartData {
  symbol: string;
  timeframe: string;
  candles: Kline[];
  indicators?: TechnicalIndicator[];
}
