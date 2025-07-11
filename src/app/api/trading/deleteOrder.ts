"use server";

import { apiFetcher } from "@/app/api/utils/api-fetcher";

interface DeleteOrderRequest {
  orderId: string;
}

export const deleteOrder = async (request: DeleteOrderRequest) => {
  const { orderId } = request;

  if (!orderId) {
    return {
      success: false,
      error: "Order ID is required",
      data: null,
      statusCode: 400,
    };
  }

  const response = await apiFetcher<any>(
    `traiding/api/Trading/order/${orderId}`,
    {
      method: "DELETE",
      fallbackErrorMessages: {
        401: "Authentication required to delete order",
        403: "Access denied to delete order",
        404: "Order not found",
        409: "Order cannot be deleted (may be filled or in progress)",
        500: "Order deletion service temporarily unavailable",
      },
    }
  );

  return response;
}; 