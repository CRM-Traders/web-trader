"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Wallet, Check, ChevronDown, Loader2 } from "lucide-react";
import { useTradingStore } from "../../store/tradingViewStore";
import { setTradingAccount } from "../../../api/trading-accounts/actions";

export function AccountSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const { selectedAccount, accounts, setSelectedAccount } = useTradingStore();

  const handleSelectAccount = async (account: any) => {
    try {
      setSwitching(account.id);
      
      // Call the server action to set the trading account
      const result = await setTradingAccount(account.id);
        console.log("Switching account result:", result);
      if (result.success) {
        setSelectedAccount(account);
        setOpen(false);
      } else {
        console.error("Failed to switch account:", result.error);
        // You might want to show a toast error here
      }
    } catch (error) {
      console.error("Error switching account:", error);
    } finally {
      setSwitching(null);
    }
  };

  if (!selectedAccount || accounts.length <= 1) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="justify-between min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="truncate">{selectedAccount.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="max-h-[300px] overflow-auto">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              disabled={switching === account.id}
              className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {switching === account.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span className="truncate">{account.name}</span>
              </div>
              {selectedAccount.id === account.id && switching !== account.id && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
