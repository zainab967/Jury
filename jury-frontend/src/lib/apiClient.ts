import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5163/api";

const AUTH_TOKEN_STORAGE_KEY = "jury-harmony.authToken";

type UnauthorizedHandler = (error: AxiosError) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (
  handler: UnauthorizedHandler | null
): void => {
  unauthorizedHandler = handler;
};

export const authTokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },
  set(token: string): void {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },
  clear(): void {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
  // Removed withCredentials - not needed for JWT tokens sent in Authorization header
});

const withAuthHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = authTokenStorage.get();
  if (!token) {
    return config;
  }

  if (!config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  
  return config;
};

apiClient.interceptors.request.use(
  (config) => {
    const configWithAuth = withAuthHeader(config);
    // Log request details in development
    if (import.meta.env.DEV) {
      console.log("API Request:", {
        method: configWithAuth.method?.toUpperCase(),
        url: `${configWithAuth.baseURL}${configWithAuth.url}`,
        data: configWithAuth.data,
        headers: configWithAuth.headers,
      });
    }
    return configWithAuth;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response details in development
    if (import.meta.env.DEV) {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      authTokenStorage.clear();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      if (unauthorizedHandler) {
        unauthorizedHandler(error);
      }
    }

    if (error.response) {
      console.error("API error:", {
        status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });
    } else {
      console.error("API request error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };

