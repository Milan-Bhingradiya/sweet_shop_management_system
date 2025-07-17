import { apiClient } from "./client"

export interface Product {
  id: number
  name: string
  price: number
  description: string
  stock_quantity: number
  categoryId: number
  image_urls: string[]
}

export const productsApi = {
  getProducts: async (params?: { page?: number; limit?: number; categoryId?: number }) => {
    const response = await apiClient.get("/v1/user/products", { params })
    return response.data
  },

  getProduct: async (id: number) => {
    const response = await apiClient.get(`/v1/user/products/${id}`)
    return response.data
  },

  // Admin endpoints
  addProduct: async (data: Omit<Product, "id">) => {
    const response = await apiClient.post("/v1/admin/products", data)
    return response.data
  },

  updateProduct: async (id: number, data: Partial<Product>) => {
    const response = await apiClient.put(`/v1/admin/products/${id}`, data)
    return response.data
  },

  deleteProduct: async (id: number) => {
    const response = await apiClient.delete(`/v1/admin/products/${id}`)
    return response.data
  },
}
