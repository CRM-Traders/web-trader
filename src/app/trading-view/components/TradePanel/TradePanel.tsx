"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TradePanelProps {
  baseBalance: number;
  quoteBalance: number;
  baseCurrency: string;
  quoteCurrency: string;
  onOrderPlaced: () => void;
}

export function TradePanel({
  baseBalance,
  quoteBalance,
  baseCurrency,
  quoteCurrency,
  onOrderPlaced,
}: TradePanelProps) {
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  const { selectedSymbol, marketData, placeOrder, loadLimitOrders, loadMarketOrders, limitOrders, marketOrders } = useTradingStore();

  useEffect(() => {
    const loadOrders = async () => {
      await loadLimitOrders();
      await loadMarketOrders();
    };
    
    if (selectedSymbol) {
      loadOrders();
    }
  }, [selectedSymbol, loadLimitOrders, loadMarketOrders]);

  useEffect(() => {
    if (marketData && orderType === "limit") {
      if (!price || price === "0" || price === "") {
        setPrice(marketData.lastPrice);
      }
    }
  }, [marketData, orderType]);

  useEffect(() => {
    if (orderType === "limit" && price && amount) {
      const priceNum = Number.parseFloat(price);
      const amountNum = Number.parseFloat(amount);
      if (priceNum > 0 && amountNum > 0) {
        const calculatedTotal = priceNum * amountNum;
        setTotal(calculatedTotal.toFixed(2));
      }
    } else if (orderType === "market") {
      setTotal("");
    }
  }, [price, amount, orderType]);

  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    setSliderValue(percentage);

    if (baseBalance <= 0 && quoteBalance <= 0) {
      console.warn("No available balance");
      return;
    }

    if (orderType === "limit") {
      if (side === "buy") {
        const priceValue = Number.parseFloat(price || "0");
        if (priceValue > 0 && quoteBalance > 0) {
          const maxAmount = quoteBalance / priceValue;
          const calculatedAmount = (maxAmount * percentage) / 100;
          setAmount(calculatedAmount.toFixed(6));
        } else if (percentage > 0) {
          console.warn("Price not set for limit buy order");
        }
      } else {
        if (baseBalance > 0) {
          const calculatedAmount = (baseBalance * percentage) / 100;
          setAmount(calculatedAmount.toFixed(6));
        }
      }
    } else {
      if (side === "buy") {
        if (quoteBalance > 0) {
          const calculatedAmount = (quoteBalance * percentage) / 100;
          setAmount(calculatedAmount.toFixed(2));
        }
      } else {
        if (baseBalance > 0) {
          const calculatedAmount = (baseBalance * percentage) / 100;
          setAmount(calculatedAmount.toFixed(6));
        }
      }
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);

    const amountNum = Number.parseFloat(value || "0");
    
    if (orderType === "limit") {
      if (side === "buy") {
        const priceValue = Number.parseFloat(price || "1");
        if (priceValue > 0 && quoteBalance > 0) {
          const maxAmount = quoteBalance / priceValue;
          const percentage = maxAmount > 0 ? (amountNum / maxAmount) * 100 : 0;
          setSliderValue(Math.min(Math.max(percentage, 0), 100));
        }
      } else {
        if (baseBalance > 0) {
          const percentage = (amountNum / baseBalance) * 100;
          setSliderValue(Math.min(Math.max(percentage, 0), 100));
        }
      }
    } else {
      if (side === "buy") {
        if (quoteBalance > 0) {
          const percentage = (amountNum / quoteBalance) * 100;
          setSliderValue(Math.min(Math.max(percentage, 0), 100));
        }
      } else {
        if (baseBalance > 0) {
          const percentage = (amountNum / baseBalance) * 100;
          setSliderValue(Math.min(Math.max(percentage, 0), 100));
        }
      }
    }
  };

  const handleTotalChange = (value: string) => {
    setTotal(value);

    const totalNum = Number.parseFloat(value || "0");
    const priceNum = Number.parseFloat(price || "0");
    
    if (priceNum > 0 && totalNum > 0) {
      const calculatedAmount = totalNum / priceNum;
      setAmount(calculatedAmount.toFixed(6));

      // Update slider
      if (side === "buy" && quoteBalance > 0) {
        const percentage = (totalNum / quoteBalance) * 100;
        setSliderValue(Math.min(Math.max(percentage, 0), 100));
      }
    }
  };

  useEffect(() => {
    setAmount("");
    setTotal("");
    setSliderValue(0);
    
    if (orderType === "limit" && marketData && (!price || price === "0")) {
      setPrice(marketData.lastPrice);
    }
  }, [orderType, side]);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      if (!amount || Number.parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (orderType === "limit" && (!price || Number.parseFloat(price) <= 0)) {
        toast.error("Please enter a valid price");
        return;
      }

      if (orderType === "limit") {
        if (side === "buy") {
          const requiredQuote = Number.parseFloat(price) * Number.parseFloat(amount);
          if (requiredQuote > quoteBalance) {
            toast.error(`Insufficient ${quoteCurrency} balance`);
            return;
          }
        } else {
          if (Number.parseFloat(amount) > baseBalance) {
            toast.error(`Insufficient ${baseCurrency} balance`);
            return;
          }
        }
      } else {
        if (side === "buy") {
          if (Number.parseFloat(amount) > quoteBalance) {
            toast.error(`Insufficient ${quoteCurrency} balance`);
            return;
          }
        } else {
          if (Number.parseFloat(amount) > baseBalance) {
            toast.error(`Insufficient ${baseCurrency} balance`);
            return;
          }
        }
      }

      await placeOrder({
        symbol: selectedSymbol,
        side: side.toUpperCase() as "BUY" | "SELL",
        type: orderType.toUpperCase() as "LIMIT" | "MARKET",
        price: orderType === "limit" ? Number.parseFloat(price) : undefined,
        quantity: Number.parseFloat(amount),
      });

      if (orderType === "limit") {
        await loadLimitOrders();
      } else {
        await loadMarketOrders();
      }

      // Reset form
      setAmount("");
      setTotal("");
      setPrice(orderType === "limit" && marketData ? marketData.lastPrice : "");
      setSliderValue(0);

      onOrderPlaced();

      toast.success(`${side.toUpperCase()} order placed successfully`);
    } catch (error: any) {
      console.error("Failed to place order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getAvailableBalance = () => {
    if (orderType === "market") {
      return side === "buy" 
        ? `${quoteBalance.toFixed(2)} ${quoteCurrency}`
        : `${baseBalance.toFixed(8)} ${baseCurrency}`;
    } else {
      return side === "buy"
        ? `${quoteBalance.toFixed(2)} ${quoteCurrency}`
        : `${baseBalance.toFixed(8)} ${baseCurrency}`;
    }
  };

  const isOrderValid = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return false;
    if (orderType === "limit" && (!price || Number.parseFloat(price) <= 0)) return false;
    return true;
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs
        defaultValue="limit"
        onValueChange={(value) => setOrderType(value as "limit" | "market")}
        className="flex-1 py-0"
      >
        <div className="flex items-center justify-between px-3 pb-4 border-b">
          <TabsList>
            <TabsTrigger value="limit">Limit</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {/* Buy/Sell Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant={side === "buy" ? "default" : "outline"}
              className={
                side === "buy" ? "bg-green-600 hover:bg-green-700" : ""
              }
              onClick={() => setSide("buy")}
              disabled={isPlacingOrder}
            >
              Buy
            </Button>
            <Button
              variant={side === "sell" ? "default" : "outline"}
              className={side === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
              onClick={() => setSide("sell")}
              disabled={isPlacingOrder}
            >
              Sell
            </Button>
          </div>

          <TabsContent value="limit" className="space-y-4 mt-0">
            {/* Price */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="price" className="text-sm">
                  Price
                </label>
                <span className="text-xs text-muted-foreground">
                  {quoteCurrency}
                </span>
              </div>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isPlacingOrder}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="amount" className="text-sm">
                  Amount
                </label>
                <span className="text-xs text-muted-foreground">
                  {baseCurrency}
                </span>
              </div>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isPlacingOrder}
              />
            </div>

            {/* Percentage Slider */}
            <div className="py-2">
              <Slider
                value={[sliderValue]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
                disabled={isPlacingOrder}
              />
              <div className="flex justify-between mt-2">
                {[25, 50, 75, 100].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSliderChange([percent])}
                    disabled={isPlacingOrder}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="total" className="text-sm">
                  Total
                </label>
                <span className="text-xs text-muted-foreground">
                  {quoteCurrency}
                </span>
              </div>
              <Input
                id="total"
                type="number"
                placeholder="0.00"
                value={total}
                onChange={(e) => handleTotalChange(e.target.value)}
                disabled={isPlacingOrder}
              />
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-4 mt-0">
            <div className="p-2 bg-muted rounded-md text-sm">
              Market orders will execute at the best available price
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="market-amount" className="text-sm">
                  {side === "buy"
                    ? `Amount (${quoteCurrency})`
                    : `Amount (${baseCurrency})`}
                </label>
              </div>
              <Input
                id="market-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isPlacingOrder}
              />
            </div>

            {/* Percentage Slider */}
            <div className="py-2">
              <Slider
                value={[sliderValue]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
                disabled={isPlacingOrder}
              />
              <div className="flex justify-between mt-2">
                {[25, 50, 75, 100].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSliderChange([percent])}
                    disabled={isPlacingOrder}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Available Balance */}
          <div className="mt-4 text-xs text-muted-foreground">
            Available: {getAvailableBalance()}
          </div>

          {/* Place Order Button */}
          <Button
            className={`mt-auto ${
              side === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !isOrderValid()}
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              `${side === "buy" ? "Buy" : "Sell"} ${baseCurrency}`
            )}
          </Button>

          {/* Recent Orders Section */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Recent Orders</div>
            <Tabs defaultValue="limit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="limit" className="text-xs">
                  Limit ({limitOrders.length})
                </TabsTrigger>
                <TabsTrigger value="market" className="text-xs">
                  Market ({marketOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="limit" className="space-y-1 max-h-32 overflow-y-auto">
                {limitOrders.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No limit orders
                  </div>
                ) : (
                  limitOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                      <div className="flex flex-col">
                        <span className={order.side === "BUY" ? "text-green-600" : "text-red-600"}>
                          {order.side} {order.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          @ {order.price} {quoteCurrency}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-1 py-0.5 rounded ${
                          order.status === "FILLED" ? "bg-green-100 text-green-800" :
                          order.status === "OPEN" ? "bg-blue-100 text-blue-800" :
                          order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="market" className="space-y-1 max-h-32 overflow-y-auto">
                {marketOrders.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No market orders
                  </div>
                ) : (
                  marketOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                      <div className="flex flex-col">
                        <span className={order.side === "BUY" ? "text-green-600" : "text-red-600"}>
                          {order.side} {order.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          Market Order
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-1 py-0.5 rounded ${
                          order.status === "FILLED" ? "bg-green-100 text-green-800" :
                          order.status === "OPEN" ? "bg-blue-100 text-blue-800" :
                          order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Tabs>
    </div>
  );
}