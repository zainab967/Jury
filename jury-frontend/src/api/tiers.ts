import apiClient from "@/lib/apiClient";

/**
 * Tier interface (matches backend TierResponse)
 */
export interface Tier {
  id: string;
  name: string;
  description?: string;
  costsJson: string; // Backend stores costs as JSON string
}

/**
 * Tier Employee interface
 */
export interface TierEmployee {
  tierId: string;
  userId: string;
  userName?: string;
  assignedAt?: string;
}

/**
 * Create Tier Payload
 */
export interface CreateTierPayload {
  name: string;
  description?: string;
  costsJson: string; // JSON string with costs: { "samosaCost": 80, "cakeCost": 1000, "lunchCost": 5500 }
}

/**
 * Update Tier Payload
 */
export interface UpdateTierPayload extends Partial<CreateTierPayload> {
  id: string;
}

/**
 * Tiers API Service
 * All tier-related API calls must go through this service
 */
export const tiersApi = {
  /**
   * Get all tiers (with pagination support)
   */
  getAll: async (page: number = 1, pageSize: number = 100): Promise<Tier[]> => {
    const response = await apiClient.get<{
      items: Tier[];
      page: number;
      pageSize: number;
      totalCount: number;
    }>("/tiers", { params: { page, pageSize } });
    return response.data.items;
  },

  /**
   * Get a tier by ID
   */
  getById: async (id: string): Promise<Tier> => {
    const response = await apiClient.get<Tier>(`/tiers/${id}`);
    return response.data;
  },

  /**
   * Create a new tier
   */
  create: async (payload: CreateTierPayload): Promise<Tier> => {
    const response = await apiClient.post<Tier>("/tiers", payload);
    return response.data;
  },

  /**
   * Update a tier
   */
  update: async (id: string, payload: Partial<CreateTierPayload>): Promise<Tier> => {
    const response = await apiClient.put<Tier>(`/tiers/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a tier
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tiers/${id}`);
  },

  // Note: Tier employee management endpoints may not exist in backend
  // These are placeholder methods - adjust based on actual backend implementation
};

