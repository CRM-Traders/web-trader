"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { Loader } from "lucide-react";

interface TradingChartProps {
  symbol: string;
}

export function TradingChart({ symbol }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("1");
  const [isLoading, setIsLoading] = useState(true);
  const { marketData } = useTradingStore();

  // Format symbol for TradingView (e.g., BTCUSDT -> BINANCE:BTCUSDT)
  const formatSymbolForTradingView = (sym: string) => {
    if (!sym) return "BINANCE:BTCUSDT";
    return `BINANCE:${sym.replace("/", "")}`;
  };

  // Initialize TradingView widget using the script tag method
  useEffect(() => {
    if (!containerRef.current || !symbol) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Create the script element with widget configuration
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;

    // Widget configuration as JSON
    const config = {
      autosize: true,
      symbol: formatSymbolForTradingView(symbol),
      interval: timeframe,
      timezone: "Etc/UTC",
      theme: "dark",
      style: chartType,
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: ["Volume@tv-basicstudies"],
      overrides: {
        "paneProperties.background": "#1a1a1a",
        "paneProperties.vertGridProperties.color": "#2a2a2a",
        "paneProperties.horzGridProperties.color": "#2a2a2a",
      },
    };

    // Add the configuration as script content
    script.innerHTML = JSON.stringify(config);

    // Create wrapper div for the widget
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    innerDiv.style.height = "calc(100% - 32px)";
    innerDiv.style.width = "100%";

    widgetDiv.appendChild(innerDiv);
    widgetDiv.appendChild(script);

    containerRef.current.appendChild(widgetDiv);

    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, timeframe, chartType]);

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader className="animate-spin w-10 h-10" />
        </div>
      )}

      <div className="flex items-center justify-between px-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{symbol || "Select Market"}</h3>
          {marketData && symbol && (
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  marketData.priceChangePercent >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {marketData.lastPrice} (
                {marketData.priceChangePercent >= 0 ? "+" : ""}
                {marketData.priceChangePercent}%)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Candles</SelectItem>
              <SelectItem value="2">Line</SelectItem>
              <SelectItem value="3">Area</SelectItem>
              <SelectItem value="8">Bars</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={timeframe} onValueChange={setTimeframe} className="h-8">
            <TabsList>
              <TabsTrigger value="1" className="h-7 px-2 text-xs">
                1m
              </TabsTrigger>
              <TabsTrigger value="5" className="h-7 px-2 text-xs">
                5m
              </TabsTrigger>
              <TabsTrigger value="15" className="h-7 px-2 text-xs">
                15m
              </TabsTrigger>
              <TabsTrigger value="60" className="h-7 px-2 text-xs">
                1h
              </TabsTrigger>
              <TabsTrigger value="240" className="h-7 px-2 text-xs">
                4h
              </TabsTrigger>
              <TabsTrigger value="1D" className="h-7 px-2 text-xs">
                1D
              </TabsTrigger>
              <TabsTrigger value="1W" className="h-7 px-2 text-xs">
                1W
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div ref={containerRef} className="h-[calc(100%-56px)] w-full" />
    </div>
  );
}
