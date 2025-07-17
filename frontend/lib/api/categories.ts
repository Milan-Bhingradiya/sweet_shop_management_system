import { apiClient } from "./client";

export interface Category {
  id: number;
  name: string;
}

export const categoriesApi = {
  getCategories: async () => {
    const response = await apiClient.get("/v1/user/listCategories");
    return response.data;
  },

  getCategory: async (id: number) => {
    const response = await apiClient.get(`/v1/user/categories/${id}`);
    return response.data;
  },

  // Admin endpoints
  addCategory: async (data: Omit<Category, "id">) => {
    const response = await apiClient.post("/v1/admin/categories", data);
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<Category>) => {
    const response = await apiClient.put(`/v1/admin/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/v1/admin/categories/${id}`);
    return response.data;
  },
};
