"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
  AlertTriangle,
} from "lucide-react";

interface ChartAnalysisPanelProps {
  symbol: string;
  data: any[];
  marketData: any;
}

export function ChartAnalysisPanel({
  symbol,
  data,
  marketData,
}: ChartAnalysisPanelProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    const recentData = data.slice(-20);
    const prices = recentData.map((d) => d.close);
    const volumes = recentData.map((d) => d.volume);

    const currentPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];

    const volatility = Math.sqrt(
      prices.reduce((acc, price) => acc + Math.pow(price - avgPrice, 2), 0) /
        prices.length
    );

    const trend = currentPrice > avgPrice ? "bullish" : "bearish";
    const volumeSignal = currentVolume > avgVolume ? "high" : "low";

    return {
      currentPrice,
      avgPrice,
      volatility,
      trend,
      volumeSignal,
      avgVolume,
      currentVolume,
      support: Math.min(...prices),
      resistance: Math.max(...prices),
    };
  }, [data]);

  if (!analysis) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Chart Analysis
        </CardTitle>
        <CardDescription>Technical analysis for {symbol}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trend</span>
            <Badge
              variant={analysis.trend === "bullish" ? "default" : "destructive"}
              className="gap-1"
            >
              {analysis.trend === "bullish" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {analysis.trend}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-sm font-mono">
              ${analysis.currentPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">20-Period Avg</span>
            <span className="text-sm font-mono">
              ${analysis.avgPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Support & Resistance */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">Support & Resistance</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Support</span>
            <span className="text-sm font-mono text-green-500">
              ${analysis.support.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Resistance</span>
            <span className="text-sm font-mono text-red-500">
              ${analysis.resistance.toFixed(2)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Volume Analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Volume</span>
            <Badge
              variant={
                analysis.volumeSignal === "high" ? "default" : "secondary"
              }
              className="gap-1"
            >
              <Activity className="h-3 w-3" />
              {analysis.volumeSignal}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current</span>
            <span className="text-sm font-mono">
              {analysis.currentVolume.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Average</span>
            <span className="text-sm font-mono">
              {analysis.avgVolume.toLocaleString()}
            </span>
          </div>
        </div>

        <Separator />

        {/* Volatility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Volatility</span>
            <Badge variant="outline">{analysis.volatility.toFixed(2)}%</Badge>
          </div>

          <Progress
            value={Math.min(analysis.volatility, 10) * 10}
            className="h-2"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <Separator />

        {/* Signals */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Signals</span>
          </div>

          <div className="space-y-1">
            {analysis.trend === "bullish" &&
              analysis.volumeSignal === "high" && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Strong bullish momentum</span>
                </div>
              )}

            {analysis.currentPrice > analysis.resistance * 0.95 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Approaching resistance</span>
              </div>
            )}

            {analysis.currentPrice < analysis.support * 1.05 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Near support level</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
