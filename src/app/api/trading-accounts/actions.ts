"use server";

import { getAccessToken } from "@/app/api/confirm-auth/postConfirmAuth";

interface TradingAccount {
  id: string;
  displayName: string;
  balance?: number;
  currency?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface CreateAccountRequest {
  displayName: string;
}

interface WalletBalance {
  id: string;
  currency: string;
  availableBalance: number;
  totalBalance: number;
  lockedBalance: number;
  usdEquivalent: number;
  lastPriceUpdate: string;
}

interface LimitOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: number; // 1 for BUY, -1 for SELL
  quantity: number;
  price: number;
}

interface MarketOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: number; // 1 for BUY, -1 for SELL
  quantity: number;
}

interface Order {
  id: string;
  symbol: string;
  side: number; // 1 for BUY, -1 for SELL
  type: string; // "LIMIT" | "MARKET"
  price?: number;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface FetchOrdersRequest {
  tradingAccountId: string;
  status?: string;
  symbol?: string;
  pageIndex?: number;
  pageSize?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const fetchTradingAccounts = async (): Promise<ApiResponse<TradingAccount[]>> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/TradingAccounts/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: Array.isArray(data) ? data : []
      };
    } else {
      console.error("Failed to fetch trading accounts:", response.status);
      return {
        success: false,
        error: `Failed to fetch trading accounts: ${response.status}`
      };
    }
  } catch (error) {
    console.error("Error fetching trading accounts:", error);
    return {
      success: false,
      error: "Failed to load trading accounts"
    };
  }
};

export const createTradingAccount = async (request: CreateAccountRequest): Promise<ApiResponse<TradingAccount>> => {
  try {
    if (!request.displayName?.trim()) {
      return {
        success: false,
        error: "Display name is required"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/TradingAccounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: request.displayName.trim(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Failed to create trading account"
      };
    }
  } catch (error) {
    console.error("Error creating trading account:", error);
    return {
      success: false,
      error: "Failed to create trading account"
    };
  }
};

export const setTradingAccount = async (tradingAccountId: string): Promise<ApiResponse<void>> => {
  try {
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const response = await fetch(`${process.env.BASE_IDENTITY_URL}/api/users/set-trading-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tradingAccountId: tradingAccountId,
      }),
    });

    if (response.ok) {
      return {
        success: true
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(response)

      return {
        success: false,
        error: errorData.message || "Failed to set trading account"
      };
    }
  } catch (error) {
    console.error("Error setting trading account:", error);
    return {
      success: false,
      error: "Failed to set trading account"
    };
  }
};

export const fetchWalletBalances = async (tradingAccountId: string): Promise<ApiResponse<WalletBalance[]>> => {
  try {
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/Wallets/${tradingAccountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Wallet balances fetched:", data);
      return {
        success: true,
        data: Array.isArray(data) ? data : []
      };
    } else {
      console.error("Failed to fetch wallet balances:", response.status);
      return {
        success: false,
        error: `Failed to fetch wallet balances: ${response.status}`
      };
    }
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    return {
      success: false,
      error: "Failed to load wallet balances"
    };
  }
};

export const placeLimitOrder = async (orderRequest: LimitOrderRequest): Promise<ApiResponse<any>> => {
  try {
    const { tradingAccountId, symbol, side, quantity, price } = orderRequest;
    
    if (!tradingAccountId || !symbol || side === undefined || !quantity || !price) {
      return {
        success: false,
        error: "Missing required fields"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/Trading/order/limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tradingAccountId,
        symbol,
        side,
        quantity,
        price
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to place limit order:", errorData);
      return {
        success: false,
        error: "Failed to place limit order"
      };
    }
  } catch (error) {
    console.error("Error placing limit order:", error);
    return {
      success: false,
      error: "Failed to place limit order"
    };
  }
};

export const placeMarketOrder = async (orderRequest: MarketOrderRequest): Promise<ApiResponse<any>> => {
  try {
    const { tradingAccountId, symbol, side, quantity } = orderRequest;
    
    if (!tradingAccountId || !symbol || side === undefined || !quantity) {
      return {
        success: false,
        error: "Missing required fields"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/Trading/order/market`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tradingAccountId,
        symbol,
        side,
        quantity
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to place market order:", errorData);
      return {
        success: false,
        error: "Failed to place market order"
      };
    }
  } catch (error) {
    console.error("Error placing market order:", error);
    return {
      success: false,
      error: "Failed to place market order"
    };
  }
};

export const fetchOrders = async (request: FetchOrdersRequest): Promise<ApiResponse<Order[]>> => {
  try {
    const { tradingAccountId, status, symbol, pageIndex = 1, pageSize = 50 } = request;
    
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    // Build query parameters
    const params = new URLSearchParams({
      tradingAccountId: tradingAccountId,
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
    });

    if (status) {
      params.append("status", status);
    }

    if (symbol) {
      params.append("symbol", symbol);
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/Trading/orders?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: Array.isArray(data) ? data : data.orders || []
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch orders:", errorData);
      return {
        success: false,
        error: "Failed to fetch orders"
      };
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders"
    };
  }
};

export const fetchLimitOrders = async (request: Omit<FetchOrdersRequest, 'status'> & { status?: string }): Promise<ApiResponse<Order[]>> => {
  try {
    const { tradingAccountId, symbol, pageIndex = 1, pageSize = 50, status } = request;
    
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    // Build query parameters for limit orders
    const params = new URLSearchParams({
      tradingAccountId: tradingAccountId,
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      type: "LIMIT"
    });

    if (status) {
      params.append("status", status);
    }

    if (symbol) {
      params.append("symbol", symbol);
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/Trading/orders?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const orders = Array.isArray(data) ? data : data.orders || [];
      // Filter for limit orders on client side as backup
      const limitOrders = orders.filter((order: Order) => order.type === "LIMIT");
      return {
        success: true,
        data: limitOrders
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch limit orders:", errorData);
      return {
        success: false,
        error: "Failed to fetch limit orders"
      };
    }
  } catch (error) {
    console.error("Error fetching limit orders:", error);
    return {
      success: false,
      error: "Failed to fetch limit orders"
    };
  }
};

export const fetchMarketOrders = async (request: Omit<FetchOrdersRequest, 'status'> & { status?: string }): Promise<ApiResponse<Order[]>> => {
  try {
    const { tradingAccountId, symbol, pageIndex = 1, pageSize = 50, status } = request;
    
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required"
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    // Build query parameters for market orders
    const params = new URLSearchParams({
      tradingAccountId: tradingAccountId,
      pageIndex: pageIndex.toString(),
      orderStatus: "",
      pageSize: pageSize.toString(),
      type: "MARKET"
    });

    if (status) {
      params.append("status", status);
    }

    if (symbol) {
      params.append("symbol", symbol);
    }

    const response = await fetch(`${process.env.BASE_TRADING_URL}/api/Trading/orders?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response)
    if (response.ok) {
      const data = await response.json();
      const orders = Array.isArray(data) ? data : data.orders || [];
      // Filter for market orders on client side as backup
      const marketOrders = orders.filter((order: Order) => order.type === "MARKET");
      return {
        success: true,
        data: marketOrders
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch market orders:", errorData);
      return {
        success: false,
        error: "Failed to fetch market orders"
      };
    }
  } catch (error) {
    console.error("Error fetching market orders:", error);
    return {
      success: false,
      error: "Failed to fetch market orders"
    };
  }
};
