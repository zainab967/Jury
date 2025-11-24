import apiClient from "@/lib/apiClient";

/**
 * Log interface (matches backend LogResponse)
 */
export interface Log {
  id: string;
  userId: string;
  action: string;
  result?: string; // Backend uses "result" instead of "description"
  createdAt: string; // Backend uses "createdAt" instead of "timestamp"
  user?: {
    id: string;
    name: string;
    email: string;
    role: "EMPLOYEE" | "JURY";
    createdAt: string;
  };
}

/**
 * Create Log Payload
 */
export interface CreateLogPayload {
  userId: string;
  action: string;
  result?: string;
}

/**
 * Logs API Service
 * All log-related API calls must go through this service
 */
export const logsApi = {
  /**
   * Get all logs (with pagination support)
   */
  getAll: async (page: number = 1, pageSize: number = 100, userId?: string): Promise<Log[]> => {
    const params: Record<string, string> = { page: page.toString(), pageSize: pageSize.toString() };
    if (userId) params.userId = userId;
    const response = await apiClient.get<{
      items: Log[];
      page: number;
      pageSize: number;
      totalCount: number;
    }>("/logs", { params });
    return response.data.items;
  },

  /**
   * Get a log by ID
   */
  getById: async (id: string): Promise<Log> => {
    const response = await apiClient.get<Log>(`/logs/${id}`);
    return response.data;
  },

  /**
   * Create a new log entry
   */
  create: async (payload: CreateLogPayload): Promise<Log> => {
    const response = await apiClient.post<Log>("/logs", payload);
    return response.data;
  },

  /**
   * Delete a log entry
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/logs/${id}`);
  },
};

