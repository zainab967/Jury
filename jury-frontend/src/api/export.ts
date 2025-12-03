import apiClient from "@/lib/apiClient";

/**
 * Export API Service
 * Handles all data export functionality
 */
export const exportApi = {
  /**
   * Export users to CSV
   */
  exportUsersToCsv: async (): Promise<Blob> => {
    const response = await apiClient.get("/export/users/csv", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export users to Excel
   */
  exportUsersToExcel: async (): Promise<Blob> => {
    const response = await apiClient.get("/export/users/excel", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export penalties to CSV
   */
  exportPenaltiesToCsv: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/penalties/csv?userId=${userId}` : "/export/penalties/csv";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export penalties to Excel
   */
  exportPenaltiesToExcel: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/penalties/excel?userId=${userId}` : "/export/penalties/excel";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export penalties to Word
   */
  exportPenaltiesToWord: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/penalties/word?userId=${userId}` : "/export/penalties/word";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export expenses to CSV
   */
  exportExpensesToCsv: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/expenses/csv?userId=${userId}` : "/export/expenses/csv";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export expenses to Excel
   */
  exportExpensesToExcel: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/expenses/excel?userId=${userId}` : "/export/expenses/excel";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export expenses to Word
   */
  exportExpensesToWord: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/expenses/word?userId=${userId}` : "/export/expenses/word";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export activities to CSV
   */
  exportActivitiesToCsv: async (): Promise<Blob> => {
    const response = await apiClient.get("/export/activities/csv", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export activities to Excel
   */
  exportActivitiesToExcel: async (): Promise<Blob> => {
    const response = await apiClient.get("/export/activities/excel", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export logs to CSV
   */
  exportLogsToCsv: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/logs/csv?userId=${userId}` : "/export/logs/csv";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export logs to Excel
   */
  exportLogsToExcel: async (userId?: string): Promise<Blob> => {
    const url = userId ? `/export/logs/excel?userId=${userId}` : "/export/logs/excel";
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export financial report to Excel
   */
  exportFinancialReportToExcel: async (startDate?: string, endDate?: string): Promise<Blob> => {
    let url = "/export/financial-report/excel";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Helper function to download a blob as a file
   */
  downloadBlob: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

