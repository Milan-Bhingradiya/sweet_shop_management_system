import { apiClient } from "./client"

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: "CUSTOMER" | "ADMIN"
}

export const authApi = {
  login: async (data: LoginData) => {
    const response = await apiClient.post("/v1/auth/login", data)
    return response.data
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post("/v1/auth/register", data)
    return response.data
  },

  verify: async () => {
    const response = await apiClient.get("/v1/auth/verify")
    return response.data
  },
}
