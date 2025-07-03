"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
} from "lightweight-charts";
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

interface LightweightChartProps {
  symbol: string;
}

interface KlineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export function LightweightChart({ symbol }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [timeframe, setTimeframe] = useState("1d");
  const [chartType, setChartType] = useState("candlestick");
  const [isLoading, setIsLoading] = useState(true);
  const { marketData } = useTradingStore();

  const fetchCandlestickData = async (
    sym: string,
    interval: string
  ): Promise<KlineData[]> => {
    try {
      const formattedSymbol = sym.replace("/", "");
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=100`
      );
      const data = await response.json();

      return data.map((kline: any[]) => ({
        time: new Date(kline[0]).toISOString().split("T")[0],
        open: Number.parseFloat(kline[1]),
        high: Number.parseFloat(kline[2]),
        low: Number.parseFloat(kline[3]),
        close: Number.parseFloat(kline[4]),
        volume: Number.parseFloat(kline[5]),
      }));
    } catch (error) {
      console.error("Failed to fetch candlestick data:", error);
      return [];
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1a1a1a" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#2a2a2a" },
        horzLines: { color: "#2a2a2a" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#485c7b",
      },
      timeScale: {
        borderColor: "#485c7b",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // For lightweight-charts v5.x, use addSeries instead of addCandlestickSeries
    const candlestickSeries = chart.addSeries("Candlestick", {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candlestickSeriesRef.current = candlestickSeries;

    // For lightweight-charts v5.x, use addSeries instead of addHistogramSeries
    const volumeSeries = chart.addSeries("Histogram", {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Load data when symbol or timeframe changes
  useEffect(() => {
    if (!symbol || !candlestickSeriesRef.current || !volumeSeriesRef.current)
      return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Map timeframe to Binance interval
        const intervalMap: { [key: string]: string } = {
          "1m": "1m",
          "5m": "5m",
          "15m": "15m",
          "1h": "1h",
          "4h": "4h",
          "1d": "1d",
          "1w": "1w",
        };

        const data = await fetchCandlestickData(
          symbol,
          intervalMap[timeframe] || "1d"
        );

        if (data.length > 0) {
          // Set candlestick data
          const candlestickData: CandlestickData[] = data.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));

          candlestickSeriesRef.current?.setData(candlestickData);

          // Set volume data
          const volumeData: HistogramData[] = data.map((d) => ({
            time: d.time,
            value: d.volume || 0,
            color: d.close >= d.open ? "#26a69a" : "#ef5350",
          }));

          volumeSeriesRef.current?.setData(volumeData);
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [symbol, timeframe]);

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader className="animate-spin w-10 h-10" />
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b">
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
              <SelectItem value="candlestick">Candles</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={timeframe} onValueChange={setTimeframe} className="h-8">
            <TabsList>
              <TabsTrigger value="1m" className="h-7 px-2 text-xs">
                1m
              </TabsTrigger>
              <TabsTrigger value="5m" className="h-7 px-2 text-xs">
                5m
              </TabsTrigger>
              <TabsTrigger value="15m" className="h-7 px-2 text-xs">
                15m
              </TabsTrigger>
              <TabsTrigger value="1h" className="h-7 px-2 text-xs">
                1h
              </TabsTrigger>
              <TabsTrigger value="4h" className="h-7 px-2 text-xs">
                4h
              </TabsTrigger>
              <TabsTrigger value="1d" className="h-7 px-2 text-xs">
                1D
              </TabsTrigger>
              <TabsTrigger value="1w" className="h-7 px-2 text-xs">
                1W
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div ref={chartContainerRef} className="h-[calc(100%-56px)] w-full" />
    </div>
  );
}
