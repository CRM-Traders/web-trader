"use client";

import { useState, useEffect, useRef } from "react";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

export function useTradingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { selectedSymbol, setMarketData } = useTradingStore();

  useEffect(() => {
    // Connect to WebSocket
    const connectWebSocket = () => {
      // For demo purposes, we'll use Binance public WebSocket
      // In production, replace with your actual WebSocket endpoint
      const formattedSymbol = selectedSymbol.replace("/", "").toLowerCase();
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${formattedSymbol}@ticker`
      );

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Format the data to match our MarketData interface
          setMarketData({
            symbol: selectedSymbol,
            lastPrice: Number.parseFloat(data.c).toFixed(2),
            priceChangePercent: Number.parseFloat(data.P),
            volume: Number.parseFloat(data.v).toFixed(2),
            high24h: Number.parseFloat(data.h).toFixed(2),
            low24h: Number.parseFloat(data.l).toFixed(2),
          });
        } catch (error) {
          console.error("Error parsing WebSocket data:", error);
        }
      };

      wsRef.current = ws;
    };

    if (selectedSymbol) {
      connectWebSocket();
    }

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedSymbol, setMarketData]);

  return { isConnected };
}
