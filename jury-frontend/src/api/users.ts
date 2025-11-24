import apiClient from "@/lib/apiClient";
import type { User } from "@/types";

/**
 * Users API Service
 * All user-related API calls must go through this service
 */
export const usersApi = {
  /**
   * Get all users (with pagination support)
   */
  getAll: async (page: number = 1, pageSize: number = 100): Promise<User[]> => {
    const response = await apiClient.get<{
      items: User[];
      page: number;
      pageSize: number;
      totalCount: number;
    }>(`/users?page=${page}&pageSize=${pageSize}`);
    return response.data.items;
  },

  /**
   * Get a user by ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (payload: Omit<User, "id" | "createdAt">): Promise<User> => {
    const response = await apiClient.post<User>("/users", payload);
    return response.data;
  },

  /**
   * Update a user
   */
  update: async (id: string, payload: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a user
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

