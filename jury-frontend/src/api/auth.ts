import apiClient from "@/lib/apiClient";
import { authTokenStorage } from "@/lib/apiClient";

/**
 * Login Payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Register Payload
 * Note: Backend expects role as integer: 0 = EMPLOYEE, 1 = JURY
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "EMPLOYEE" | "JURY" | 0 | 1; // Can be string or integer
}

/**
 * Login Response
 */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "EMPLOYEE" | "JURY" | 0 | 1; // Backend may return enum as string or number
    createdAt: string;
  };
}

/**
 * Auth API Service
 * All authentication-related API calls must go through this service
 */
export const authApi = {
  /**
   * Login with email and password
   * Password is sent as plain text - backend handles hashing/verification with BCrypt
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", payload);
    
    // Store the token
    if (response.data.token) {
      authTokenStorage.set(response.data.token);
    }
    
    return response.data;
  },

  /**
   * Logout (clear token)
   */
  logout: (): void => {
    authTokenStorage.clear();
  },

  /**
   * Register a new user
   * Password is sent as plain text - backend handles hashing with BCrypt
   * Note: Backend expects role as integer (0 = EMPLOYEE, 1 = JURY)
   */
  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    // Convert role string to integer for backend
    const backendPayload = {
      ...payload,
      role: typeof payload.role === "string" 
        ? (payload.role === "JURY" ? 1 : 0)
        : payload.role
    };
    
    const response = await apiClient.post<LoginResponse>("/auth/register", backendPayload);
    
    // Store the token
    if (response.data.token) {
      authTokenStorage.set(response.data.token);
    }
    
    return response.data;
  },

  /**
   * Get current user (verify token)
   */
  getCurrentUser: async (): Promise<LoginResponse["user"]> => {
    const response = await apiClient.get<LoginResponse["user"]>("/auth/me");
    return response.data;
  },
};

