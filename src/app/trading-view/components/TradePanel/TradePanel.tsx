"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

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

  const { selectedSymbol, marketData } = useTradingStore();

  // Update price when market data changes
  useEffect(() => {
    if (marketData && orderType === "limit" && !price) {
      setPrice(marketData.lastPrice);
    }
  }, [marketData, orderType, price]);

  // Calculate total when price or amount changes
  useEffect(() => {
    if (price && amount) {
      const calculatedTotal =
        Number.parseFloat(price) * Number.parseFloat(amount);
      setTotal(calculatedTotal.toFixed(2));
    } else {
      setTotal("");
    }
  }, [price, amount]);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    setSliderValue(percentage);

    if (side === "buy") {
      // Calculate amount based on quote balance and percentage
      const maxAmount = quoteBalance / Number.parseFloat(price || "0");
      const calculatedAmount = (maxAmount * percentage) / 100;
      setAmount(calculatedAmount.toFixed(6));
    } else {
      // Calculate amount based on base balance and percentage
      const calculatedAmount = (baseBalance * percentage) / 100;
      setAmount(calculatedAmount.toFixed(6));
    }
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(value);

    // Update slider based on amount
    if (side === "buy") {
      const maxAmount = quoteBalance / Number.parseFloat(price || "1");
      const percentage = (Number.parseFloat(value || "0") / maxAmount) * 100;
      setSliderValue(Math.min(percentage, 100));
    } else {
      const percentage = (Number.parseFloat(value || "0") / baseBalance) * 100;
      setSliderValue(Math.min(percentage, 100));
    }
  };

  // Handle total change
  const handleTotalChange = (value: string) => {
    setTotal(value);

    if (price && Number.parseFloat(price) > 0) {
      const calculatedAmount =
        Number.parseFloat(value) / Number.parseFloat(price);
      setAmount(calculatedAmount.toFixed(6));

      // Update slider
      if (side === "buy") {
        const percentage = (Number.parseFloat(value) / quoteBalance) * 100;
        setSliderValue(Math.min(percentage, 100));
      }
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    try {
      // Validate inputs
      if (!amount || Number.parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      if (orderType === "limit" && (!price || Number.parseFloat(price) <= 0)) {
        alert("Please enter a valid price");
        return;
      }

      // Check balance
      if (side === "buy" && Number.parseFloat(total) > quoteBalance) {
        alert(`Insufficient ${quoteCurrency} balance`);
        return;
      }

      if (side === "sell" && Number.parseFloat(amount) > baseBalance) {
        alert(`Insufficient ${baseCurrency} balance`);
        return;
      }

      // Simulate order placement
      console.log("Placing order:", {
        symbol: selectedSymbol,
        side,
        type: orderType,
        price: orderType === "limit" ? Number.parseFloat(price) : undefined,
        amount: Number.parseFloat(amount),
        total: Number.parseFloat(total),
      });

      // In a real app, you would call your API here
      // await tradingService.placeOrder(...)

      // Reset form
      setAmount("");
      setTotal("");
      setSliderValue(0);

      // Notify parent
      onOrderPlaced();

      // Show success message
      alert(`${side.toUpperCase()} order placed successfully`);
    } catch (error) {
      console.error("Failed to place order:", error);
      alert("Failed to place order");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs
        defaultValue="limit"
        onValueChange={(value) => setOrderType(value as "limit" | "market")}
        className="flex-1"
      >
        <div className="flex items-center justify-between p-4 border-b">
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
            >
              Buy
            </Button>
            <Button
              variant={side === "sell" ? "default" : "outline"}
              className={side === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
              onClick={() => setSide("sell")}
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
              />
            </div>

            {/* Percentage Slider */}
            <div className="py-2">
              <Slider
                value={[sliderValue]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
              />
              <div className="flex justify-between mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([25])}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([50])}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([75])}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([100])}
                >
                  100%
                </Button>
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
              />
            </div>

            {/* Percentage Slider */}
            <div className="py-2">
              <Slider
                value={[sliderValue]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
              />
              <div className="flex justify-between mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([25])}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([50])}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([75])}
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([100])}
                >
                  100%
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Available Balance */}
          <div className="mt-4 text-xs text-muted-foreground">
            Available:{" "}
            {side === "buy"
              ? `${quoteBalance.toFixed(2)} ${quoteCurrency}`
              : `${baseBalance.toFixed(8)} ${baseCurrency}`}
          </div>

          {/* Place Order Button */}
          <Button
            className={`mt-auto ${
              side === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handlePlaceOrder}
          >
            {side === "buy" ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
