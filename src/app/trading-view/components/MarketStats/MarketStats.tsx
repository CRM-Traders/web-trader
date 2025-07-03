"use client";

import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

interface MarketStatsProps {
  symbol: string;
}

export function MarketStats({ symbol }: MarketStatsProps) {
  const { marketData } = useTradingStore();

  if (!marketData) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      <div>
        <span className="text-muted-foreground mr-1">24h Change:</span>
        <span
          className={
            marketData.priceChangePercent >= 0
              ? "text-green-500"
              : "text-red-500"
          }
        >
          {marketData.priceChangePercent >= 0 ? "+" : ""}
          {marketData.priceChangePercent}%
        </span>
      </div>
      <div>
        <span className="text-muted-foreground mr-1">24h High:</span>
        <span>{marketData.high24h}</span>
      </div>
      <div>
        <span className="text-muted-foreground mr-1">24h Low:</span>
        <span>{marketData.low24h}</span>
      </div>
      <div>
        <span className="text-muted-foreground mr-1">24h Volume:</span>
        <span>{marketData.volume}</span>
      </div>
    </div>
  );
}
