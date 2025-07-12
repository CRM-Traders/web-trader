"use client";

import { useState, useEffect } from "react";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { fetchOrders } from "@/app/api/trading/fetchOrders";

// Helper function to convert status number to string
const statusToString = (status: number): string => {
  switch (status) {
    case 1:
      return "PENDING";
    case 2:
      return "PARTIALLY_FILLED";
    case 3:
      return "FILLED";
    case 4:
      return "CANCELLED";
    case 5:
      return "REJECTED";
    default:
      return "UNKNOWN";
  }
};

// Helper function to get status styling
const getStatusStyle = (status: number): string => {
  switch (status) {
    case 3:
      return "text-green-600"; // FILLED
    case 1:
      return "text-blue-600"; // PENDING
    case 2:
      return "text-yellow-600"; // PARTIALLY_FILLED
    case 4:
      return "text-red-600"; // CANCELLED
    case 5:
      return "text-red-600"; // REJECTED
    default:
      return "text-gray-600";
  }
};

interface OrderHistoryProps {
  type: "open" | "all";
}

export function TradeHistory({ type }: OrderHistoryProps) {
  const { selectedAccount } = useTradingStore();
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders directly from API
  useEffect(() => {
    const loadOrders = async () => {
      if (!selectedAccount?.id) {
        setError("No trading account selected");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchOrders({
          tradingAccountId: selectedAccount.id,
          pageIndex: 0,
          pageSize: 100,
        });

        if (response.success && response.data) {
          setFetchedOrders(response.data);
        } else {
          setError(response.error || "Failed to fetch orders");
        }
      } catch (err) {
        setError("Failed to fetch orders");
        console.error("Error fetching orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [selectedAccount?.id]);

  // Use fetched orders for history, fallback to store for other types
  const orders =
    type === "all"
      ? fetchedOrders
      : fetchedOrders;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">No {type} orders found</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Pair</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Side</th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Price</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-right p-2">Total</th>
            {type === "open" && <th className="text-right p-2">Action</th>}
          </tr>
        </thead>
        <tbody>
          {fetchedOrders.map((order) => (
            <tr key={order.id} className="border-b hover:bg-muted/50">
              <td className="p-2 text-xs">
                {new Date(order.createdAt).toLocaleString()}
              </td>
              <td className="p-2">{order.symbol?.replace(/([A-Z]+)([A-Z]+)/, '$1/$2')}</td>
              <td className="p-2">{order.type === 1 ? "MARKET" : "LIMIT"}</td>
              <td className="p-2">
                <span
                  className={
                    order.side === 1
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {order.side === 1 ? "BUY" : "SELL"}
                </span>
              </td>
              <td className="p-2">
                <span className={`text-xs ${getStatusStyle(order.status)}`}>
                  {statusToString(order.status)}
                </span>
              </td>
              <td className="p-2 text-right">{order.price?.toFixed(2)}</td>
              <td className="p-2 text-right">{order.quantity.toFixed(6)}</td>
              <td className="p-2 text-right">
                {order.price && (order.price * order.quantity).toFixed(2)}
              </td>
              {type === "open" && (
                <td className="p-2 text-right">
                  <button className="text-xs text-red-500 hover:underline">
                    Cancel
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}