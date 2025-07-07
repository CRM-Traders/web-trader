// src/lib/hooks/useTradingViewAdvanced.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { toast } from "react-hot-toast";

interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  type: "above" | "below";
  active: boolean;
  createdAt: Date;
}

interface ChartTemplate {
  id: string;
  name: string;
  config: Record<string, any>;
  indicators: string[];
  drawings: any[];
}

export function useTradingViewAdvanced() {
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [chartTemplates, setChartTemplates] = useState<ChartTemplate[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [chartHistory, setChartHistory] = useState<any[]>([]);
  const { selectedSymbol, marketData } = useTradingStore();

  // Price Alerts Management
  const createPriceAlert = useCallback(
    (price: number, type: "above" | "below") => {
      const newAlert: PriceAlert = {
        id: Date.now().toString(),
        symbol: selectedSymbol,
        price,
        type,
        active: true,
        createdAt: new Date(),
      };

      setPriceAlerts((prev) => [...prev, newAlert]);
      toast.success(`Alert created: ${selectedSymbol} ${type} ${price}`);

      return newAlert;
    },
    [selectedSymbol]
  );

  const removePriceAlert = useCallback((alertId: string) => {
    setPriceAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    toast.success("Alert removed");
  }, []);

  const togglePriceAlert = useCallback((alertId: string) => {
    setPriceAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, active: !alert.active } : alert
      )
    );
  }, []);

  // Check price alerts
  useEffect(() => {
    if (!marketData?.lastPrice) return;

    priceAlerts.forEach((alert) => {
      if (!alert.active || alert.symbol !== selectedSymbol) return;

      const triggered =
        alert.type === "above"
          ? Number(marketData.lastPrice) >= alert.price
          : Number(marketData.lastPrice) <= alert.price;

      if (triggered) {
        toast.success(
          `🔔 Price Alert: ${alert.symbol} is ${alert.type} ${alert.price}!`,
          { duration: 5000 }
        );

        // Deactivate alert after triggering
        togglePriceAlert(alert.id);
      }
    });
  }, [marketData?.lastPrice, priceAlerts, selectedSymbol]);

  // Chart Templates
  const saveChartTemplate = useCallback(
    (name: string, config: any) => {
      const template: ChartTemplate = {
        id: Date.now().toString(),
        name,
        config: config.chartConfig || {},
        indicators: config.indicators || [],
        drawings: config.drawings || [],
      };

      setChartTemplates((prev) => [...prev, template]);
      localStorage.setItem(
        "tradingview_templates",
        JSON.stringify([...chartTemplates, template])
      );
      toast.success(`Template "${name}" saved`);

      return template;
    },
    [chartTemplates]
  );

  const loadChartTemplate = useCallback(
    (templateId: string) => {
      const template = chartTemplates.find((t) => t.id === templateId);
      if (!template) {
        toast.error("Template not found");
        return null;
      }

      toast.success(`Template "${template.name}" loaded`);
      return template;
    },
    [chartTemplates]
  );

  const deleteChartTemplate = useCallback(
    (templateId: string) => {
      setChartTemplates((prev) => prev.filter((t) => t.id !== templateId));
      const updated = chartTemplates.filter((t) => t.id !== templateId);
      localStorage.setItem("tradingview_templates", JSON.stringify(updated));
      toast.success("Template deleted");
    },
    [chartTemplates]
  );

  // Load saved templates on mount
  useEffect(() => {
    const saved = localStorage.getItem("tradingview_templates");
    if (saved) {
      try {
        setChartTemplates(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load templates:", error);
      }
    }
  }, []);

  // Chart Recording/Replay
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setChartHistory([]);
    toast.success("Recording started");
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    toast.success(`Recording stopped. ${chartHistory.length} frames captured`);
    return chartHistory;
  }, [chartHistory]);

  const recordFrame = useCallback(
    (frameData: any) => {
      if (isRecording) {
        setChartHistory((prev) => [
          ...prev,
          {
            timestamp: Date.now(),
            data: frameData,
          },
        ]);
      }
    },
    [isRecording]
  );

  // Advanced Analysis
  const calculateTechnicalLevels = useCallback(() => {
    if (!marketData) return null;

    const { high24h, low24h, lastPrice } = marketData;

    // Ensure numeric values
    const numHigh = Number(high24h);
    const numLow = Number(low24h);
    const numLastPrice = Number(lastPrice);

    // Pivot Points
    const pivot = (numHigh + numLow + numLastPrice) / 3;
    const r1 = 2 * pivot - numLow;
    const r2 = pivot + (numHigh - numLow);
    const s1 = 2 * pivot - numHigh;
    const s2 = pivot - (numHigh - numLow);

    // Fibonacci Levels
    const diff = numHigh - numLow;
    const fib236 = numHigh - diff * 0.236;
    const fib382 = numHigh - diff * 0.382;
    const fib500 = numHigh - diff * 0.5;
    const fib618 = numHigh - diff * 0.618;

    return {
      pivotPoints: { pivot, r1, r2, s1, s2 },
      fibonacciLevels: { fib236, fib382, fib500, fib618 },
      range: { high24h, low24h, diff },
    };
  }, [marketData]);

  // Multi-timeframe Analysis
  const getMultiTimeframeData = useCallback(
    async (symbol: string, timeframes: string[]) => {
      try {
        // This would connect to your backend API
        const promises = timeframes.map((tf) =>
          fetch(`/api/trading/candles?symbol=${symbol}&interval=${tf}`).then(
            (res) => res.json()
          )
        );

        const results = await Promise.all(promises);
        return results.map((data, index) => ({
          timeframe: timeframes[index],
          data,
        }));
      } catch (error) {
        console.error("Failed to fetch multi-timeframe data:", error);
        return [];
      }
    },
    []
  );

  return {
    // Price Alerts
    priceAlerts,
    createPriceAlert,
    removePriceAlert,
    togglePriceAlert,

    // Templates
    chartTemplates,
    saveChartTemplate,
    loadChartTemplate,
    deleteChartTemplate,

    // Recording
    isRecording,
    chartHistory,
    startRecording,
    stopRecording,
    recordFrame,

    // Analysis
    calculateTechnicalLevels,
    getMultiTimeframeData,
  };
}
