"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { Wallet, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function WalletBalance() {
  const { walletBalances, loadWalletBalances, selectedSymbol } =
    useTradingStore();
  const [showAllBalances, setShowAllBalances] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadWalletBalances();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletBalances();
    setIsRefreshing(false);
  };

  // Get current trading pair currencies
  const [baseCurrency, quoteCurrency] = selectedSymbol
    ? selectedSymbol.split("/")
    : ["BTC", "USDT"];

  // Filter balances for current trading pair
  const tradingPairBalances = walletBalances.filter(
    (wallet) =>
      wallet.currency === baseCurrency || wallet.currency === quoteCurrency
  );

  // Get balances with non-zero amounts
  const nonZeroBalances = walletBalances.filter(
    (wallet) => wallet.totalBalance > 0
  );

  const displayBalances = showAllBalances
    ? nonZeroBalances
    : tradingPairBalances;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Wallet Balance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllBalances(!showAllBalances)}
              className="h-7 px-2"
            >
              {showAllBalances ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 px-2"
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayBalances.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No balances to display
          </div>
        ) : (
          displayBalances.map((wallet) => (
            <div key={wallet.currency} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{wallet.currency}</span>
                  {(wallet.currency === baseCurrency ||
                    wallet.currency === quoteCurrency) && (
                    <Badge variant="outline" className="text-xs h-4">
                      Trading
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {wallet.availableBalance.toLocaleString(undefined, {
                      minimumFractionDigits: wallet.currency === "USDT" ? 2 : 8,
                      maximumFractionDigits: wallet.currency === "USDT" ? 2 : 8,
                    })}
                  </div>
                  {wallet.lockedBalance > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Locked:{" "}
                      {wallet.lockedBalance.toLocaleString(undefined, {
                        minimumFractionDigits:
                          wallet.currency === "USDT" ? 2 : 8,
                        maximumFractionDigits:
                          wallet.currency === "USDT" ? 2 : 8,
                      })}
                    </div>
                  )}
                </div>
              </div>

              {wallet.totalBalance !== wallet.availableBalance && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total Balance:</span>
                  <span className="font-mono">
                    {wallet.totalBalance.toLocaleString(undefined, {
                      minimumFractionDigits: wallet.currency === "USDT" ? 2 : 8,
                      maximumFractionDigits: wallet.currency === "USDT" ? 2 : 8,
                    })}
                  </span>
                </div>
              )}

              {displayBalances.indexOf(wallet) < displayBalances.length - 1 && (
                <Separator />
              )}
            </div>
          ))
        )}

        {showAllBalances && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground text-center">
              Showing {nonZeroBalances.length} of {walletBalances.length}{" "}
              currencies
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
