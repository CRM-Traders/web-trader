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

declare global {
  interface Window {
    TradingView: {
      widget: new (config: ChartConfiguration) => TradingViewWidget;
      [key: string]: any;
    };
  }
}
