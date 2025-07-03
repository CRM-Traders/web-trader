"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

export function MarketSelector() {
  const { selectedSymbol, availableSymbols, setSelectedSymbol } =
    useTradingStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter symbols based on search query
  const filteredSymbols = availableSymbols.filter((symbol) =>
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
        >
          {selectedSymbol || "Select Market"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredSymbols.map((symbol) => (
            <button
              key={symbol}
              className={`w-full text-left px-4 py-2 hover:bg-muted ${
                symbol === selectedSymbol ? "bg-muted" : ""
              }`}
              onClick={() => {
                setSelectedSymbol(symbol);
                setSearchQuery("");
              }}
            >
              {symbol}
            </button>
          ))}
          {filteredSymbols.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No markets found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
