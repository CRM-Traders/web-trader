export interface ChartConfiguration {
  autosize?: boolean;
  symbol?: string;
  interval?: string;
  timezone?: string;
  theme?: "light" | "dark";
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
  width?: number | string;
  height?: number | string;
  studies?: string[];
  watchlist?: string[];
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
}

export interface TradingViewWidget {
  remove: () => void;
  [key: string]: any;
}

// Ticket Types
export enum TicketType {
  Deposit = 0,
  Withdraw = 1
}

export enum TicketStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Cancelled = 3,
  Failed = 4,
  Rejected = 5
}

export interface TicketDto {
  id: string;
  tradingAccountId: string;
  type: TicketType;
  status: TicketStatus;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTicketCommand {
  tradingAccountId: string;
  type: TicketType;
  amount: number;
  currency: string;
  description?: string;
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: ChartConfiguration) => TradingViewWidget;
      [key: string]: any;
    };
  }
}
