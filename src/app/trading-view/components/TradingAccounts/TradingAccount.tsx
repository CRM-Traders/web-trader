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
import { useTradingStore } from "../../store/tradingViewStore";
import {
  fetchTradingAccounts,
  createTradingAccount,
  setTradingAccount,
} from "@/app/api/trading";
import type {
  TradingAccountDto,
  CreateTradingAccountRequest,
  TradingAccount,
} from "@/app/api/types/trading";

interface TradingAccountModalProps {
  allowSkip?: boolean;
  onAccountSelected?: () => void;
}

export function TradingAccountModal({
  allowSkip = false,
  onAccountSelected,
}: TradingAccountModalProps) {
  const [accounts, setAccounts] = useState<TradingAccountDto[]>([]);
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
    setLoading(true);
    setError(null);

    const result = await fetchTradingAccounts();

    if (result.success) {
      setAccounts(result.data || []);
    } else {
      setAccounts([]);
    }

    setLoading(false);
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;

    setCreating(true);
    setError(null);

    const request: CreateTradingAccountRequest = {
      displayName: newAccountName.trim(),
    };

    const result = await createTradingAccount(request);

    if (result.success) {
      setNewAccountName("");
      setShowCreateForm(false);
      await fetchAccounts(); // Refresh the list
    } else {
    }

    setCreating(false);
  };

  const handleSelectAccount = async (account: TradingAccountDto) => {
    setSelecting(account.id);
    setError(null);

    const result = await setTradingAccount(account.id);

    if (result.success) {
      // Transform the account data to match the store's TradingAccount interface
      const tradingAccount: TradingAccount = {
        id: account.id,
        name: account.displayName,
        wallets: [], // This will be populated when wallet data is loaded
      };

      setSelectedAccount(tradingAccount);

      // Call the callback if provided
      onAccountSelected?.();
    } else {
    }

    setSelecting(null);
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewAccountName("");
    setError(null);
  };

  const getAccountStatus = (account: TradingAccountDto) => {
    if (account.status === "Active")
      return { text: "Active", color: "text-green-600" };
    if (account.status === "Suspended")
      return { text: "Suspended", color: "text-red-600" };
    return { text: account.status, color: "text-gray-500" };
  };

  const isCurrentlySelected = (accountId: string) =>
    selectedAccount?.id === accountId;
  const isBeingSelected = (accountId: string) => selecting === accountId;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
        <h2 className="text-2xl font-semibold">Loading Trading Accounts</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
        <Wallet className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-semibold text-red-600">Error</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <div className="flex gap-2">
          <Button onClick={fetchAccounts}>Try Again</Button>
          <Button
            variant="outline"
            // onClick={() =>
            //   (window.location.href = "https://online.salesvault.dev/login")
            // }
          >
            Go to Login
          </Button>
        </div>
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
      {/* Header */}
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Create Account Form */}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newAccountName.trim()) {
                    handleCreateAccount();
                  }
                }}
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
                onClick={resetCreateForm}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Available Accounts</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const currentlySelected = isCurrentlySelected(account.id);
              const beingSelected = isBeingSelected(account.id);
              const status = getAccountStatus(account);

              return (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    beingSelected
                      ? "opacity-50 pointer-events-none"
                      : currentlySelected
                      ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                      : "hover:shadow-md hover:border-blue-500"
                  }`}
                  onClick={() => !beingSelected && handleSelectAccount(account)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{account.displayName}</span>
                      <div className="flex items-center gap-2">
                        {beingSelected && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {currentlySelected && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Account: {account.accountNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Initial Balance:
                        </span>
                        <span className="font-medium">
                          ${account.initialBalance.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Type:
                        </span>
                        <span className="text-sm">{account.accountType}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status:
                        </span>
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Created:
                        </span>
                        <span className="text-sm">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {account.verifiedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Verified:
                          </span>
                          <span className="text-sm text-green-600">
                            {new Date(account.verifiedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p
                          className={`text-xs font-medium ${
                            beingSelected
                              ? "text-blue-600"
                              : currentlySelected
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {beingSelected
                            ? "Selecting account..."
                            : currentlySelected
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
