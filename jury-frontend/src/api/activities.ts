import apiClient from "@/lib/apiClient";

/**
 * Activity interface
 */
export interface Activity {
  id: string;
  name: string;
  description?: string;
  date: string;
  employeeName?: string;
  createdAt?: string;
}

/**
 * Create Activity Payload
 */
export interface CreateActivityPayload {
  name: string;
  description?: string;
  date: string; // Required - must be provided
}

/**
 * Update Activity Payload
 */
export interface UpdateActivityPayload extends Partial<CreateActivityPayload> {
  id: string;
}

/**
 * Activities API Service
 * All activity-related API calls must go through this service
 */
export const activitiesApi = {
  /**
   * Get all activities (with pagination support)
   */
  getAll: async (page: number = 1, pageSize: number = 100): Promise<Activity[]> => {
    const response = await apiClient.get<{
      items: Activity[];
      page: number;
      pageSize: number;
      totalCount: number;
    }>("/activities", { params: { page, pageSize } });
    return response.data.items;
  },

  /**
   * Get an activity by ID
   */
  getById: async (id: string): Promise<Activity> => {
    const response = await apiClient.get<Activity>(`/activities/${id}`);
    return response.data;
  },

  /**
   * Create a new activity
   */
  create: async (payload: CreateActivityPayload): Promise<Activity> => {
    const response = await apiClient.post<Activity>("/activities", payload);
    return response.data;
  },

  /**
   * Update an activity
   */
  update: async (id: string, payload: Partial<CreateActivityPayload>): Promise<Activity> => {
    const response = await apiClient.put<Activity>(`/activities/${id}`, payload);
    return response.data;
  },

  /**
   * Delete an activity
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/activities/${id}`);
  },
};

