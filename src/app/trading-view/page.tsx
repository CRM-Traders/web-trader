"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  Wallet,
  Settings,
  AlertCircle,
  TrendingUp,
  Loader,
  LogOut,
  User,
  ArrowLeftRight,
} from "lucide-react";
import { useTradingWebSocket } from "./hooks/useTradingWebSocket";
import {
  useHasHydrated,
  useTradingStore,
  clearAllTradingStoreData,
} from "./store/tradingViewStore";
import { MarketSelector } from "./components/MarketSelector/MarketSelector";
import { MarketStats } from "./components/MarketStats/MarketStats";
import { TradingChart } from "./components/TradingChart/TradingChart";
import { OrderHistory } from "./components/OrderHistory/OrderHistory";
import { ChartAnalysisPanel } from "./components/ChartAnalysisPanel/ChartAnalysisPanel";
import { OrderBook } from "./components/OrderBook/OrderBook";
import { TradePanel } from "./components/TradePanel/TradePanel";
import { WalletBalance } from "./components/WalletBalance/WalletBalance";
import { ChartSettingsPanel } from "./components/ChartSettingsPanel/ChartSettingsPanel";
import { TradingAccountModal } from "./components/TradingAccounts/TradingAccount";
import {
  getUserInfo,
  isAuthenticated,
  logout,
  postConfirmAuth,
} from "../api/auth";
import { fetchTradingAccounts } from "../api/trading";

// Authentication loading component
function AuthenticationLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">TradePro</h1>
          <p className="text-slate-400">Advanced Trading Platform</p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-blue-400" />
          <div className="space-y-2 text-center">
            <p className="text-white font-medium">Authenticating...</p>
            <p className="text-slate-400 text-sm">
              Please wait while we verify your access
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Secure connection established</span>
        </div>
      </div>
    </div>
  );
}

// Authentication error component
// function AuthenticationError({ onRetry }: { onRetry: () => void }) {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
//       <div className="absolute inset-0">
//         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
//       </div>

//       <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-6">
//         <div className="flex items-center justify-center mb-6">
//           <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
//             <AlertCircle className="w-8 h-8 text-red-400" />
//           </div>
//         </div>

//         <div className="space-y-2">
//           <h1 className="text-2xl font-bold text-white">Access Denied</h1>
//           <p className="text-slate-400">Unable to verify your authentication</p>
//         </div>

//         <div className="space-y-4">
//           <p className="text-slate-300 text-sm">
//             Your session may have expired or the authentication token is
//             invalid.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-3 justify-center">
//             <Button
//               onClick={onRetry}
//               variant="outline"
//               className="bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700"
//             >
//               Try Again
//             </Button>
//             <Button
//               onClick={() =>
//                 (window.location.href = "https://online.salesvault.dev/login")
//               }
//               variant="outline"
//               className="bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700"
//             >
//               Go to Login
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function SpotTradingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "error"
  >("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);

  // Account selection state
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const {
    selectedSymbol,
    marketData,
    selectedAccount,
    setSelectedAccount,
    setAccounts,
    loadOrders,
    loadWalletBalances,
    walletBalances,
    resetStore,
  } = useTradingStore();
  const hasHydrated = useHasHydrated();
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { isConnected } = useTradingWebSocket();

  // Handle authentication on component mount
  useEffect(() => {
    const handleAuth = async () => {
      const ctx = searchParams.get("ctx");
      console.log("Authentication context:", ctx);
      // Check if already authenticated (from cookies)
      if (!ctx && isAuthenticated()) {
        setAuthStatus("authenticated");
        setUserInfo(getUserInfo());

        // Clear the store to ensure we don't load old data
        clearAllTradingStoreData();
        resetStore();
        return;
      }

      // if (!ctx) {
      //   window.location.href = "https://online.salesvault.dev/login";
      //   // No ctx parameter and not authenticated, redirect to sign-in
      //   return;
      // }

      try {
        setAuthStatus("loading");
        const authResult = await postConfirmAuth(ctx!);
        console.log("Authentication result:", authResult);

        if (authResult) {
          setAuthStatus("authenticated");
          setUserInfo(getUserInfo());

          // Clear the store when a new user authenticates
          clearAllTradingStoreData();
          resetStore();

          // Remove ctx from URL after successful authentication
          const url = new URL(window.location.href);
          url.searchParams.delete("ctx");
          window.history.replaceState({}, "", url.toString());

          toast.success("Authentication successful!");
        } else {
          setAuthStatus("error");
          setAuthError("Authentication failed");
          toast.error("Authentication failed");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthStatus("error");
        setAuthError("Network error during authentication");
        toast.error("Network error during authentication");
        console.error("Auth check failed:", error);
        if (error && typeof error === "object" && "message" in error) {
          console.error("Error details:", {
            message: (error as { message?: string }).message,
            stack: (error as { stack?: string }).stack,
            name: (error as { name?: string }).name,
          });
          setAuthStatus("error");
          setAuthError(
            `Network error: ${(error as { message?: string }).message}`
          );
          toast.error(
            `Network error: ${(error as { message?: string }).message}`
          );
        } else {
          setAuthStatus("error");
          setAuthError("Network error during authentication");
          toast.error("Network error during authentication");
        }
      }
    };

    handleAuth();
  }, [searchParams, router]);

  // Load trading accounts after authentication
  useEffect(() => {
    if (authStatus === "authenticated" && hasHydrated && !accountsLoaded) {
      loadTradingAccounts();
    }
  }, [authStatus, hasHydrated, accountsLoaded]);

  // Show account selection if no account is selected and accounts are loaded
  useEffect(() => {
    if (accountsLoaded && !selectedAccount && !showAccountSelection) {
      setShowAccountSelection(true);
    }
  }, [accountsLoaded, selectedAccount, showAccountSelection]);

  // Load trading data when account is selected
  useEffect(() => {
    if (
      authStatus === "authenticated" &&
      hasHydrated &&
      selectedAccount?.id &&
      !showAccountSelection
    ) {
      loadPageData();
    }
  }, [
    authStatus,
    hasHydrated,
    selectedAccount?.id,
    selectedSymbol,
    showAccountSelection,
  ]);

  const loadTradingAccounts = async () => {
    try {
      const result = await fetchTradingAccounts();
      console.log("Trading accounts result:", result);
      if (result.success && result.data) {
        const transformedAccounts = result.data.map((account) => ({
          id: account.id,
          name: account.displayName,
          wallets: [], // Ensure wallets is always an array
        }));
        setAccounts(transformedAccounts);
        setAccountsLoaded(true);

        // Don't automatically select any account - let the user choose
        // This prevents automatic selection
      }
    } catch (error) {
      console.error("Failed to load trading accounts:", error);
      toast.error("Failed to load trading accounts");
      setAccountsLoaded(true);
    }
  };

  const loadPageData = async () => {
    if (!selectedAccount?.id) return;

    try {
      setIsLoading(true);
      await loadWalletBalances();
      await loadOrders();
    } catch (error) {
      console.error("Failed to load trading data:", error);
      toast.error("Failed to load trading data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRetry = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      // Clear all trading store data before logout
      clearAllTradingStoreData();
      resetStore();
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  const handleAccountSelected = () => {
    setShowAccountSelection(false);
  };

  const handleSwitchAccount = () => {
    setShowAccountSelection(true);
  };

  // Show authentication loader
  if (authStatus === "loading") {
    return <AuthenticationLoader />;
  }

  // Show authentication error
  // if (authStatus === "error") {
  //   return <AuthenticationError onRetry={handleAuthRetry} />;
  // }

  // Show loading if store hasn't hydrated yet
  if (!hasHydrated) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-muted-foreground">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show account selection modal
  if (showAccountSelection || (!selectedAccount && accountsLoaded)) {
    return (
      <TradingAccountModal
        allowSkip={!!selectedAccount}
        onAccountSelected={handleAccountSelected}
      />
    );
  }

  // Show loading for trading data
  if (isLoading && !selectedAccount) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-muted-foreground">Loading trading data...</p>
        </div>
      </div>
    );
  }

  // Don't show trading interface if no account is selected
  if (!selectedAccount) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-4">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-semibold">
            No Trading Account Selected
          </h2>
          <p className="text-muted-foreground">
            Please select a trading account to continue
          </p>
          <Button onClick={handleSwitchAccount}>
            <Wallet className="h-4 w-4 mr-2" />
            Select Account
          </Button>
        </div>
      </div>
    );
  }

  // Get current trading pair balances
  const [baseCurrency, quoteCurrency] = selectedSymbol.split("/");
  const baseWallet = walletBalances.find((w) => w.currency === baseCurrency);
  const quoteWallet = walletBalances.find((w) => w.currency === quoteCurrency);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col p-4 mb-4">
      {/* Market Header */}
      <div className="flex items-center justify-between mb-4">
        <MarketSelector />
        <div className="flex items-center gap-4">
          <MarketStats symbol={selectedSymbol} />

          {/* Account Info with Switch Button */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedAccount.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchAccount}
              className="h-6 w-6 p-0"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-muted-foreground">
              {isConnected ? "Live" : "Disconnected"}
            </span>
          </div>

          {/* User Info */}
          {userInfo && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {userInfo.name || userInfo.email}
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Left Column - Chart */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card className="h-[500px]">
            <TradingChart symbol={selectedSymbol} />
          </Card>

          {/* Orders */}
          <Card className="h-[calc(100%-32.2rem)]">
            <Tabs defaultValue="openOrders" className="h-full mx-3">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="openOrders">Open Orders</TabsTrigger>
                <TabsTrigger value="orderHistory">Order History</TabsTrigger>
                <TabsTrigger value="tradeHistory">Trade History</TabsTrigger>
              </TabsList>
              <TabsContent
                value="openOrders"
                className="h-[calc(100%-40px)] overflow-auto"
              >
                <OrderHistory type="open" />
              </TabsContent>
              <TabsContent
                value="orderHistory"
                className="h-[calc(100%-40px)] overflow-auto"
              >
                <OrderHistory type="history" />
              </TabsContent>
              <TabsContent
                value="tradeHistory"
                className="h-[calc(100%-40px)] overflow-auto"
              >
                <OrderHistory type="trades" />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Analysis, Order Book & Trade Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Chart Analysis Panel */}
          <ChartAnalysisPanel
            symbol={selectedSymbol}
            data={[]}
            marketData={marketData}
          />

          <WalletBalance />

          {/* Trade Panel */}
          <Card className="min-h-[350px]">
            <TradePanel
              baseBalance={baseWallet?.availableBalance || 0}
              quoteBalance={quoteWallet?.availableBalance || 0}
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              onOrderPlaced={loadPageData}
            />
          </Card>

          {/* Order Book */}
          <Card className="h-[300px]">
            {selectedSymbol ? (
              <OrderBook symbol={selectedSymbol} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a symbol to view order book
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Settings Panel */}
      <ChartSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

// Main export component with Suspense wrapper
export default function SpotTradingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SpotTradingContent />
    </Suspense>
  );
}
