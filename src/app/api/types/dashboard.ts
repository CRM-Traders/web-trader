import { UserSettings } from "./auth";
import type {
  TradingAccountDto,
  WalletDto,
  PortfolioDto,
  TicketDto,
} from "./trading";

export interface DashboardData {
  tradingAccounts: TradingAccountDto[];
  wallets: WalletDto[];
  portfolio: PortfolioDto | null;
  tickets: TicketDto[];
  totalBalance: number;
  totalUsdValue: number;
}

export interface DashboardStats {
  totalAssets: number;
  totalCashBalance: number;
  totalInvestments: number;
  totalSavings: number;
  activeTickets: number;
  portfolioValue: number;
  accountStatus: string;
}

export interface FinanceData {
  tradingAccounts: TradingAccountDto[];
  allWallets: WalletDto[];
  portfolios: PortfolioDto[];
  recentTickets: TicketDto[];
  totalAssets: number;
  totalCashBalance: number;
  totalInvestments: number;
  totalSavings: number;
}

export interface UserContextType {
  user: UserSettings | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}
