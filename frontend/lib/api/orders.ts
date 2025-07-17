import { apiClient } from "./client";

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderData {
  customer_name: string;
  phone_number: string;
  order_type: "DINE_IN" | "DELIVERY";
  items: OrderItem[];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
}

export const ordersApi = {
  createOrder: async (data: CreateOrderData) => {
    const response = await apiClient.post("/v1/user/orders", data);
    return response.data;
  },

  getMyOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get("/v1/user/orders", { params });
    return response.data;
  },

  getOrder: async (id: number) => {
    const response = await apiClient.get(`/v1/user/orders/${id}`);
    return response.data;
  },

  // Admin endpoints
  getAllOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get("/v1/admin/orders", { params });
    return response.data;
  },

  updateOrderStatus: async (id: number, status: "PENDING" | "COMPLETED") => {
    const response = await apiClient.put(`/v1/admin/orders/${id}/status`, {
      status,
    });
    return response.data;
  },
};
