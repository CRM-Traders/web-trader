"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [depth, setDepth] = useState<"10" | "20" | "50">("20");
  const { marketData } = useTradingStore();

  useEffect(() => {
    // Fetch order book data
    const fetchOrderBook = async () => {
      try {
        const formattedSymbol = symbol.replace("/", "");
        const response = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${formattedSymbol}&limit=${depth}`
        );
        const data = await response.json();

        // Process asks (sell orders)
        let totalAsks = 0;
        const formattedAsks = data.asks
          .slice(0, Number.parseInt(depth))
          .map((ask: string[]) => {
            const price = Number.parseFloat(ask[0]);
            const amount = Number.parseFloat(ask[1]);
            totalAsks += amount;
            return { price, amount, total: totalAsks };
          });

        // Process bids (buy orders)
        let totalBids = 0;
        const formattedBids = data.bids
          .slice(0, Number.parseInt(depth))
          .map((bid: string[]) => {
            const price = Number.parseFloat(bid[0]);
            const amount = Number.parseFloat(bid[1]);
            totalBids += amount;
            return { price, amount, total: totalBids };
          });

        setAsks(formattedAsks);
        setBids(formattedBids);
      } catch (error) {
        console.error("Failed to fetch order book:", error);
      }
    };

    if (symbol) {
      fetchOrderBook();
      // Set up interval to refresh order book
      const interval = setInterval(fetchOrderBook, 5000);
      return () => clearInterval(interval);
    }
  }, [symbol, depth]);

  // Find the max total for visualization
  const maxTotal = Math.max(...[...asks, ...bids].map((entry) => entry.total));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Order Book</h3>
        <Tabs
          value={depth}
          onValueChange={(value) => setDepth(value as "10" | "20" | "50")}
          className="h-8"
        >
          <TabsList>
            <TabsTrigger value="10" className="h-6 px-2 text-xs">
              10
            </TabsTrigger>
            <TabsTrigger value="20" className="h-6 px-2 text-xs">
              20
            </TabsTrigger>
            <TabsTrigger value="50" className="h-6 px-2 text-xs">
              50
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Headers */}
        <div className="grid grid-cols-3 text-xs text-muted-foreground px-4 py-2">
          <div>Price</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total</div>
        </div>

        {/* Asks (Sell Orders) - Displayed in reverse order (lowest ask first) */}
        <div className="flex-1 overflow-y-auto">
          {asks
            .slice()
            .reverse()
            .map((ask, index) => (
              <div
                key={`ask-${index}`}
                className="grid grid-cols-3 text-xs px-4 py-1 relative"
              >
                <div
                  className="absolute inset-0 bg-red-500/10"
                  style={{
                    width: `${(ask.total / maxTotal) * 100}%`,
                    left: "auto",
                    right: 0,
                  }}
                />
                <div className="text-red-500 z-10">{ask.price.toFixed(2)}</div>
                <div className="text-right z-10">{ask.amount.toFixed(6)}</div>
                <div className="text-right z-10">{ask.total.toFixed(6)}</div>
              </div>
            ))}
        </div>

        {/* Current price */}
        {marketData && (
          <div className="grid grid-cols-3 px-4 py-2 border-y bg-muted/30">
            <div
              className={`font-medium ${
                marketData.priceChangePercent >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {marketData.lastPrice}
            </div>
            <div className="text-right col-span-2">
              <span
                className={`text-xs ${
                  marketData.priceChangePercent >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {marketData.priceChangePercent >= 0 ? "+" : ""}
                {marketData.priceChangePercent}%
              </span>
            </div>
          </div>
        )}

        {/* Bids (Buy Orders) */}
        <div className="flex-1 overflow-y-auto">
          {bids.map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="grid grid-cols-3 text-xs px-4 py-1 relative"
            >
              <div
                className="absolute inset-0 bg-green-500/10"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <div className="text-green-500 z-10">{bid.price.toFixed(2)}</div>
              <div className="text-right z-10">{bid.amount.toFixed(6)}</div>
              <div className="text-right z-10">{bid.total.toFixed(6)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
