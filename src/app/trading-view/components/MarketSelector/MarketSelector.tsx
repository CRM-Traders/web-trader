"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";
import { fetchMarketSymbols, type MarketSymbol } from "@/app/api/trading/fetchMarketSymbols";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { createSymbol } from "../../utils/symbol-utils";

export function MarketSelector() {
  const { selectedSymbol, setSelectedSymbol, setAvailableSymbols: setStoreAvailableSymbols } = useTradingStore();

  // Local state for market symbols
  const [localAvailableSymbols, setLocalAvailableSymbols] = useState<MarketSymbol[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pageSize] = useState(50);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Load market symbols when component mounts (only if not already loaded)
  useEffect(() => {
    const currentSymbols = useTradingStore.getState().availableSymbols;
    if (currentSymbols.length === 0) {
      console.log("🔍 [MarketSelector] Component mounted, loading market symbols");
      loadMarketSymbols();
    } else {
      console.log("🔍 [MarketSelector] Component mounted, symbols already available:", currentSymbols.length);
      setLocalAvailableSymbols(currentSymbols);
    }
  }, []);

  // Load market symbols from API
  const loadMarketSymbols = async (params?: {
    search?: string;
    pageSize?: number;
    pageIndex?: number;
    append?: boolean;
  }) => {
    setIsLoading(true);

    try {
      const response = await fetchMarketSymbols({
        search: params?.search ?? searchQuery,
        pageSize: params?.pageSize ?? pageSize,
        pageIndex: params?.pageIndex ?? pageIndex,
      });
      if (response.success && response.data) {
        // Process symbols - API returns MarketSymbol objects
        const symbols = Array.isArray(response.data) ? response.data : [];

        if (params?.append) {
          // Append to existing symbols for pagination
          const newSymbols = [...localAvailableSymbols, ...symbols];
          setLocalAvailableSymbols(newSymbols);
          // Update store with all symbols
          setStoreAvailableSymbols(newSymbols);
        } else {
          // Replace symbols for new search
          setLocalAvailableSymbols(symbols);
          // Update store with new symbols
          setStoreAvailableSymbols(symbols);

          // If this is the initial load and we have symbols, ensure selectedSymbol exists
          if (symbols.length > 0 && !params?.search) {
            const currentSelectedSymbol = useTradingStore.getState().selectedSymbol;
            const symbolExists = symbols.some(s => `${s.baseAsset}/${s.quoteAsset}` === currentSelectedSymbol);
            if (!symbolExists) {
              // Auto-select the first available symbol if current one doesn't exist
              const firstSymbol = `${symbols[0].baseAsset}/${symbols[0].quoteAsset}`;
              console.log(`🔄 Auto-selecting first available symbol: ${firstSymbol}`);
              useTradingStore.getState().setSelectedSymbol(firstSymbol);
            }
          }
        }

        // Check if we have more data
        setHasMore(symbols.length === pageSize);

        // Update page index if not appending
        if (!params?.append) {
          setPageIndex(params?.pageIndex ?? 0);
        }
      } else {
        console.error("❌ [MarketSelector] Failed to load market symbols:", response.error);
        setLocalAvailableSymbols([]);
        setStoreAvailableSymbols([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("❌ [MarketSelector] Error loading market symbols:", error);
      setLocalAvailableSymbols([]);
      setStoreAvailableSymbols([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== "") {
        loadMarketSymbols({
          search: searchQuery,
          pageSize,
          pageIndex: 0,
          append: false,
        });
      } else {
        // Load initial symbols when search is cleared
        loadMarketSymbols({
          pageSize,
          pageIndex: 0,
          append: false,
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load more symbols when scrolling to bottom (pagination)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !isLoading && hasMore) {
      const nextPage = pageIndex + 1;
      setPageIndex(nextPage);
      loadMarketSymbols({
        search: searchQuery,
        pageSize,
        pageIndex: nextPage,
        append: true,
      });
    }
  };

  // Handle symbol selection
  const handleSymbolSelect = (baseAsset: string, quoteAsset: string) => {
    setSelectedSymbol(`${baseAsset}/${quoteAsset}`);
    setSearchQuery("");
    setIsOpen(false); // Close the dropdown
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
        >
          {selectedSymbol ? selectedSymbol : "Select Market"}
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
        <div className="max-h-60 overflow-y-auto" onScroll={handleScroll}>
          {localAvailableSymbols.map((marketSymbol: MarketSymbol, index: number) => (
            <button
              key={index}
              className={`w-full text-left px-4 py-2 hover:bg-muted ${`${marketSymbol.baseAsset}/${marketSymbol.quoteAsset}` === selectedSymbol ? "bg-muted" : ""
                }`}
              onClick={() => handleSymbolSelect(marketSymbol.baseAsset, marketSymbol.quoteAsset)}
            >
              <div className="flex justify-between items-center">
                <span>{createSymbol(marketSymbol.baseAsset, marketSymbol.quoteAsset)}</span>
                <span className="text-xs text-muted-foreground">
                  {marketSymbol.baseAsset}/{marketSymbol.quoteAsset}
                </span>
              </div>
            </button>
          ))}
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}
          {localAvailableSymbols.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? `No markets found for "${searchQuery}"` : "No markets available"}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

