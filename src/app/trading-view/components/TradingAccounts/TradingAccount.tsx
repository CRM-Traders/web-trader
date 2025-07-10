"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
  fetchTradingAccounts,
  createTradingAccount,
  setTradingAccount,
} from "@/app/api/trading-accounts/actions";
import { useTradingStore } from "../../store/tradingViewStore";

interface TradingAccount {
  id: string;
  displayName: string;
  balance?: number;
  currency?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface TradingAccountModalProps {
  allowSkip?: boolean; // Allow users to skip if they already have a selected account
  onAccountSelected?: () => void; // Callback when account is selected
}

export function TradingAccountModal({
  allowSkip = false,
  onAccountSelected,
}: TradingAccountModalProps) {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { setSelectedAccount, selectedAccount } = useTradingStore();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchTradingAccounts();

      if (result.success) {
        setAccounts(result.data || []);
      } else {
        setError(result.error || "Failed to load trading accounts");
        setAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching trading accounts:", error);
      setError("Failed to load trading accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const result = await createTradingAccount({
        displayName: newAccountName.trim(),
      });

      if (result.success) {
        setNewAccountName("");
        setShowCreateForm(false);
        await fetchAccounts(); // Refresh the list
      } else {
        setError(result.error || "Failed to create trading account");
      }
    } catch (error) {
      console.error("Error creating trading account:", error);
      setError("Failed to create trading account");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAccount = async (account: TradingAccount) => {
    try {
      setSelecting(account.id);
      setError(null);

      // Call the server action to set the trading account
      const result = await setTradingAccount(account.id);

      if (result.success) {
        // Transform the account data to match the store's TradingAccount interface
        const tradingAccount = {
          id: account.id,
          name: account.displayName,
          wallets: [], // This will be populated when wallet data is loaded
        };

        setSelectedAccount(tradingAccount);

        // Call the callback if provided
        if (onAccountSelected) {
          onAccountSelected();
        }
      } else {
        setError(result.error || "Failed to select trading account");
      }
    } catch (error) {
      console.error("Error selecting trading account:", error);
      setError("Failed to select trading account");
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
        <h2 className="text-2xl font-semibold">Loading Trading Accounts</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <Wallet className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-semibold text-red-600">Error</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={fetchAccounts}>Try Again</Button>
        <Button onClick={() => window.location.href = "https://online.salesvault.dev/login"}>Go to Login</Button>
      </div>
    );
  }

  if (accounts.length === 0 && !showCreateForm) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <Wallet className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Trading Account</h2>
        <p className="text-muted-foreground">
          Please create a trading account to start trading
        </p>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Trading Account
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Select Trading Account</h2>
          <p className="text-muted-foreground">
            Choose a trading account to continue
          </p>
        </div>
        <div className="flex gap-2">
          {allowSkip && selectedAccount && (
            <Button variant="outline" onClick={() => onAccountSelected?.()}>
              Continue with Current Account
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Trading Account</CardTitle>
            <CardDescription>
              Enter a display name for your new trading account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Display Name</Label>
              <Input
                id="accountName"
                placeholder="e.g., Main Trading Account"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateAccount}
                disabled={creating || !newAccountName.trim()}
              >
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Account
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAccountName("");
                  setError(null);
                }}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Available Accounts</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const isCurrentlySelected = selectedAccount?.id === account.id;
              const isBeingSelected = selecting === account.id;

              return (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isBeingSelected
                      ? "opacity-50 pointer-events-none"
                      : isCurrentlySelected
                      ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                      : "hover:shadow-md hover:border-blue-500"
                  }`}
                  onClick={() =>
                    !isBeingSelected && handleSelectAccount(account)
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{account.displayName}</span>
                      <div className="flex items-center gap-2">
                        {isBeingSelected && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {isCurrentlySelected && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardTitle>
                    <CardDescription>ID: {account.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {account.balance !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Balance:
                          </span>
                          <span className="font-medium">
                            {account.balance} {account.currency || "USD"}
                          </span>
                        </div>
                      )}
                      {account.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Created:
                          </span>
                          <span className="text-sm">
                            {new Date(account.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {account.isActive !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Status:
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              account.isActive
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <p
                          className={`text-xs font-medium ${
                            isBeingSelected
                              ? "text-blue-600"
                              : isCurrentlySelected
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {isBeingSelected
                            ? "Selecting account..."
                            : isCurrentlySelected
                            ? "Currently selected"
                            : "Click to select this account"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
