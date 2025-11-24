import apiClient from "@/lib/apiClient";
import type { Penalty, CreatePenaltyPayload, UpdatePenaltyPayload } from "@/types";

/**
 * Penalties API Service
 * All penalty-related API calls must go through this service
 */
export const penaltiesApi = {
  /**
   * Get all penalties (with pagination support)
   */
  getAll: async (page: number = 1, pageSize: number = 100, userId?: string): Promise<Penalty[]> => {
    const params: Record<string, string> = { page: page.toString(), pageSize: pageSize.toString() };
    if (userId) params.userId = userId;
    const response = await apiClient.get<{
      items: Penalty[];
      page: number;
      pageSize: number;
      totalCount: number;
    }>("/penalties", { params });
    return response.data.items;
  },

  /**
   * Get a penalty by ID
   */
  getById: async (id: string): Promise<Penalty> => {
    const response = await apiClient.get<Penalty>(`/penalties/${id}`);
    return response.data;
  },

  /**
   * Create a new penalty
   */
  create: async (payload: CreatePenaltyPayload): Promise<Penalty> => {
    const response = await apiClient.post<Penalty>("/penalties", payload);
    return response.data;
  },

  /**
   * Update a penalty
   */
  update: async (id: string, payload: Partial<UpdatePenaltyPayload>): Promise<Penalty> => {
    const response = await apiClient.put<Penalty>(`/penalties/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a penalty
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/penalties/${id}`);
  },
};

