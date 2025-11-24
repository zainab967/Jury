import apiClient from "@/lib/apiClient";

/**
 * Expense interface (matches backend ExpenseResponse)
 */
export interface Expense {
  id: string;
  userId: string;
  activityId?: string; // Added activityId support
  totalCollection: number;
  bill: number;
  arrears: number;
  notes?: string;
  status: "completed" | "pending" | "deficit";
  date: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "EMPLOYEE" | "JURY";
    createdAt: string;
  };
}

/**
 * Create Expense Payload
 */
export interface CreateExpensePayload {
  userId: string; // Required by backend
  activityId?: string; // Optional activity ID
  totalCollection: number;
  bill: number;
  arrears: number; // Required by backend (computed as totalCollection - bill)
  notes?: string;
  status: "completed" | "pending" | "deficit"; // Required by backend
  date?: string;
}

/**
 * Update Expense Payload
 */
export interface UpdateExpensePayload extends Partial<CreateExpensePayload> {
  id: string;
}

/**
 * Expenses API Service
 * All expense-related API calls must go through this service
 */
export const expensesApi = {
  /**
   * Get all expenses (with pagination support)
   */
  getAll: async (page: number = 1, pageSize: number = 100, userId?: string): Promise<Expense[]> => {
    const params: Record<string, string> = { page: page.toString(), pageSize: pageSize.toString() };
    if (userId) params.userId = userId;
    const response = await apiClient.get<{
      items: Expense[];
      page: number;
      pageSize: number;
      totalCount: number;
    }>("/expenses", { params });
    return response.data.items;
  },

  /**
   * Get an expense by ID
   */
  getById: async (id: string): Promise<Expense> => {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Create a new expense
   */
  create: async (payload: CreateExpensePayload): Promise<Expense> => {
    const response = await apiClient.post<Expense>("/expenses", payload);
    return response.data;
  },

  /**
   * Update an expense
   */
  update: async (id: string, payload: Partial<CreateExpensePayload>): Promise<Expense> => {
    const response = await apiClient.put<Expense>(`/expenses/${id}`, payload);
    return response.data;
  },

  /**
   * Delete an expense
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};

