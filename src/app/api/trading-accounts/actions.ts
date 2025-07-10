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
  side: number; // 1 for BUY, 2 for SELL (matching C# OrderSide enum)
  quantity: number;
  price: number;
  type: number; // 2 for LIMIT (matching C# OrderType enum)
}

interface MarketOrderRequest {
  tradingAccountId: string;
  symbol: string;
  side: number; // 1 for BUY, 2 for SELL (matching C# OrderSide enum)
  quantity: number;
  type: number; // 1 for MARKET (matching C# OrderType enum)
}

interface Order {
  id: string;
  symbol: string;
  side: number; // 1 for BUY, 2 for SELL (matching C# OrderSide enum)
  type: number; // 1 for MARKET, 2 for LIMIT (matching C# OrderType enum)
  price?: number;
  quantity: number;
  status: number; // 1=Pending, 2=PartiallyFilled, 3=Filled, 4=Cancelled, 5=Rejected (matching C# OrderStatus enum)
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

export const fetchTradingAccounts = async (): Promise<
  ApiResponse<TradingAccount[]>
> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/TradingAccounts/user`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      };
    } else {
      console.error("Failed to fetch trading accounts:", response.status);
      return {
        success: false,
        error: `Failed to fetch trading accounts: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("Error fetching trading accounts:", error);
    return {
      success: false,
      error: "Failed to load trading accounts",
    };
  }
};

export const createTradingAccount = async (
  request: CreateAccountRequest
): Promise<ApiResponse<TradingAccount>> => {
  try {
    if (!request.displayName?.trim()) {
      return {
        success: false,
        error: "Display name is required",
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/TradingAccounts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: request.displayName.trim(),
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Failed to create trading account",
      };
    }
  } catch (error) {
    console.error("Error creating trading account:", error);
    return {
      success: false,
      error: "Failed to create trading account",
    };
  }
};

export const setTradingAccount = async (
  tradingAccountId: string
): Promise<ApiResponse<void>> => {
  try {
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required",
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${process.env.BASE_IDENTITY_URL}/api/users/set-trading-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tradingAccountId: tradingAccountId,
        }),
      }
    );

    if (response.ok) {
      return {
        success: true,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));

      return {
        success: false,
        error: errorData.message || "Failed to set trading account",
      };
    }
  } catch (error) {
    console.error("Error setting trading account:", error);
    return {
      success: false,
      error: "Failed to set trading account",
    };
  }
};

export const fetchWalletBalances = async (
  tradingAccountId: string
): Promise<ApiResponse<WalletBalance[]>> => {
  try {
    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required",
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/Wallets/${tradingAccountId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      };

    } else {
      console.error("Failed to fetch wallet balances:", response.status);
      return {
        success: false,
        error: `Failed to fetch wallet balances: ${response.status}`,
      };
    }
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    return {
      success: false,
      error: "Failed to load wallet balances",
    };
  }
};

export const placeLimitOrder = async (
  orderRequest: LimitOrderRequest
): Promise<ApiResponse<any>> => {
  try {
    const { tradingAccountId, symbol, side, quantity, price } = orderRequest;
    console.log("placeLimitOrder", orderRequest);
    if (
      !tradingAccountId ||
      !symbol ||
      side === undefined ||
      !quantity ||
      !price
    ) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Add type field to the request
    const limitOrderData = {
      ...orderRequest,
      type: 2 // LIMIT enum value
    };

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/Trading/order/limit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(limitOrderData),
      }
    );

    if (response.ok) {
      const orderId = await response.text(); // API returns UUID string
      return {
        success: true,
        data: { id: orderId, status: "OPEN" }, // Create a simple response object
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to place limit order:", errorData);
      return {
        success: false,
        error: "Failed to place limit order",
      };
    }
  } catch (error) {
    console.error("Error placing limit order:", error);
    return {
      success: false,
      error: "Failed to place limit order",
    };
  }
};
export const placeMarketOrder = async (
  orderRequest: MarketOrderRequest
): Promise<ApiResponse<any>> => {
  try {
    console.log("placeMarketOrder received:", orderRequest);
    const { tradingAccountId, symbol, side, quantity } = orderRequest;

    if (!tradingAccountId || !symbol || side === undefined || !quantity) {
      console.log("Missing required fields for market order:", { tradingAccountId, symbol, side, quantity });
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Add type field to the request
    const marketOrderData = {
      ...orderRequest,
      type: 1 // MARKET enum value
    };

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    console.log("Sending market order to API:", JSON.stringify(marketOrderData));
    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/Trading/order/market`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(marketOrderData),
      }
    );

    if (response.ok) {
      const orderId = await response.text(); // API returns UUID string
      return {
        success: true,
        data: { id: orderId, status: "OPEN" }, // Create a simple response object
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to place market order:", errorData);
      return {
        success: false,
        error: "Failed to place market order",
      };
    }
  } catch (error) {
    console.error("Error placing market order:", error);
    return {
      success: false,
      error: "Failed to place market order",
    };
  }
};

export const fetchOrders = async (
  request: FetchOrdersRequest
): Promise<ApiResponse<Order[]>> => {
  try {
    const {
      tradingAccountId,
      status,
      symbol,
      pageIndex = 1,
      pageSize = 50,
    } = request;

    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required",
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Build query parameters - always include all parameters even if empty
    const params = new URLSearchParams({
      tradingAccountId: tradingAccountId,
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      status: status || "",
      symbol: symbol || "",
    });

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/Trading/orders?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      console.log("fetchOrders response", data);
      
      // Map API response to frontend format
      const mapApiOrderToOrder = (apiOrder: any): Order => {
        // Map orderType to type number
        let type = 1; // Default MARKET
        if (apiOrder.orderType === "Limit") type = 2;

        // Map side to number (1=BUY, 2=SELL)
        let side = 1; // Default BUY
        if (apiOrder.side === "Sell" || apiOrder.side === 2) side = 2;

        // Map status string to number
        let status = 1; // Default Pending
        switch (apiOrder.status) {
          case "Pending": status = 1; break;
          case "PartiallyFilled": status = 2; break;
          case "Filled": status = 3; break;
          case "Cancelled": status = 4; break;
          case "Rejected": status = 5; break;
          default: status = 1;
        }

        return {
          id: apiOrder.id,
          symbol: apiOrder.tradingPairSymbol,
          side,
          type,
          price: apiOrder.price,
          quantity: apiOrder.quantity,
          status,
          createdAt: apiOrder.createdAt,
        };
      };

      const orders = (data.items || data.orders || data || []).map(mapApiOrderToOrder);
      
      return {
        success: true,
        data: orders,
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch orders:", errorData);
      return {
        success: false,
        error: "Failed to fetch orders",
      };
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
    };
  }
};

export const fetchLimitOrders = async (
  request: Omit<FetchOrdersRequest, "status"> & { status?: string }
): Promise<ApiResponse<Order[]>> => {
  try {
    const {
      tradingAccountId,
      symbol,
      pageIndex = 1,
      pageSize = 50,
      status,
    } = request;

    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required",
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Build query parameters for limit orders - always include all parameters even if empty
    const params = new URLSearchParams({
      tradingAccountId: tradingAccountId,
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      status: status || "",
      symbol: symbol || "",
    });

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/Trading/orders?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // Map API response to frontend format
      const mapApiOrderToOrder = (apiOrder: any): Order => {
        // Map orderType to type number
        let type = 1; // Default MARKET
        if (apiOrder.orderType === "Limit") type = 2;

        // Map side to number (1=BUY, 2=SELL)
        let side = 1; // Default BUY
        if (apiOrder.side === "Sell" || apiOrder.side === 2) side = 2;

        // Map status string to number
        let status = 1; // Default Pending
        switch (apiOrder.status) {
          case "Pending": status = 1; break;
          case "PartiallyFilled": status = 2; break;
          case "Filled": status = 3; break;
          case "Cancelled": status = 4; break;
          case "Rejected": status = 5; break;
          default: status = 1;
        }

        return {
          id: apiOrder.id,
          symbol: apiOrder.tradingPairSymbol,
          side,
          type,
          price: apiOrder.price,
          quantity: apiOrder.quantity,
          status,
          createdAt: apiOrder.createdAt,
        };
      };

      const orders = (data.items || data.orders || data || []).map(mapApiOrderToOrder);
      // Filter for limit orders on client side as backup
      const limitOrders = orders.filter(
        (order: Order) => order.type === 2 // LIMIT enum value
      );
      return {
        success: true,
        data: limitOrders,
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch limit orders:", errorData);
      return {
        success: false,
        error: "Failed to fetch limit orders",
      };
    }
  } catch (error) {
    console.error("Error fetching limit orders:", error);
    return {
      success: false,
      error: "Failed to fetch limit orders",
    };
  }
};

export const fetchMarketOrders = async (
  request: Omit<FetchOrdersRequest, "status"> & { status?: string }
): Promise<ApiResponse<Order[]>> => {
  try {
    const {
      tradingAccountId,
      symbol,
      pageIndex = 1,
      pageSize = 50,
      status,
    } = request;

    if (!tradingAccountId) {
      return {
        success: false,
        error: "Trading account ID is required",
      };
    }

    const token = await getAccessToken();
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Build query parameters for market orders - always include all parameters even if empty
    const params = new URLSearchParams({
      tradingAccountId: tradingAccountId,
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
      status: status || "",
      symbol: symbol || "",
    });

    const response = await fetch(
      `${process.env.BASE_TRADING_URL}/api/Trading/orders?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      
      // Map API response to frontend format
      const mapApiOrderToOrder = (apiOrder: any): Order => {
        // Map orderType to type number
        let type = 1; // Default MARKET
        if (apiOrder.orderType === "Limit") type = 2;

        // Map side to number (1=BUY, 2=SELL)
        let side = 1; // Default BUY
        if (apiOrder.side === "Sell" || apiOrder.side === 2) side = 2;

        // Map status string to number
        let status = 1; // Default Pending
        switch (apiOrder.status) {
          case "Pending": status = 1; break;
          case "PartiallyFilled": status = 2; break;
          case "Filled": status = 3; break;
          case "Cancelled": status = 4; break;
          case "Rejected": status = 5; break;
          default: status = 1;
        }

        return {
          id: apiOrder.id,
          symbol: apiOrder.tradingPairSymbol,
          side,
          type,
          price: apiOrder.price,
          quantity: apiOrder.quantity,
          status,
          createdAt: apiOrder.createdAt,
        };
      };

      const orders = (data.items || data.orders || data || []).map(mapApiOrderToOrder);
      // Filter for market orders on client side as backup
      const marketOrders = orders.filter(
        (order: Order) => order.type === 1 // MARKET enum value
      );
      return {
        success: true,
        data: marketOrders,
      };
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch market orders:", errorData);
      return {
        success: false,
        error: "Failed to fetch market orders",
      };
    }
  } catch (error) {
    console.error("Error fetching market orders:", error);
    return {
      success: false,
      error: "Failed to fetch market orders",
    };
  }
};
