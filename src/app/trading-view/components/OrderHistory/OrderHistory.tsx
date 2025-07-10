"use client";

import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

// Helper function to convert status number to string
const statusToString = (status: number): string => {
  switch (status) {
    case 1: return "PENDING";
    case 2: return "PARTIALLY_FILLED";
    case 3: return "FILLED";
    case 4: return "CANCELLED";
    case 5: return "REJECTED";
    default: return "UNKNOWN";
  }
};

// Helper function to get status styling
const getStatusStyle = (status: number): string => {
  switch (status) {
    case 3: return "text-green-600"; // FILLED
    case 1: return "text-blue-600"; // PENDING
    case 2: return "text-yellow-600"; // PARTIALLY_FILLED
    case 4: return "text-red-600"; // CANCELLED
    case 5: return "text-red-600"; // REJECTED
    default: return "text-gray-600";
  }
};

interface OrderHistoryProps {
  type: "open" | "history" | "trades";
}

export function OrderHistory({ type }: OrderHistoryProps) {
  const { openOrders, orderHistory, tradeHistory } = useTradingStore();

  // Select the appropriate data based on type
  const orders =
    type === "open"
      ? openOrders
      : type === "history"
      ? orderHistory
      : tradeHistory;

  console.log(`OrderHistory component - type: ${type}`, {
    openOrders,
    orderHistory,
    tradeHistory,
    selectedOrders: orders
  });

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
          {orders.map((order) => (
            <tr key={order.id} className="border-b hover:bg-muted/50">
              <td className="p-2 text-xs">
                {new Date(order.createdAt).toLocaleString()}
              </td>
              <td className="p-2">{order.symbol}</td>
              <td className="p-2">{order.type}</td>
              <td className="p-2">
                <span
                  className={
                    order.side === "BUY" ? "text-green-500" : "text-red-500"
                  }
                >
                  {order.side}
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
