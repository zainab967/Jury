/**
 * API Services
 * 
 * All API calls must go through the services defined in this directory.
 * Do not use apiClient directly in components or pages.
 * 
 * Usage:
 *   import { usersApi, penaltiesApi } from "@/api";
 * 
 *   const users = await usersApi.getAll();
 *   const penalty = await penaltiesApi.create(payload);
 */

export { usersApi } from "./users";
export { penaltiesApi } from "./penalties";
export { activitiesApi } from "./activities";
export { expensesApi } from "./expenses";
export { logsApi } from "./logs";
export { tiersApi } from "./tiers";
export { authApi } from "./auth";

// Export types
export type { Activity, CreateActivityPayload, UpdateActivityPayload } from "./activities";
export type { Expense, CreateExpensePayload, UpdateExpensePayload } from "./expenses";
export type { Log, CreateLogPayload } from "./logs";
export type { Tier, TierEmployee, CreateTierPayload, UpdateTierPayload } from "./tiers";
export type { LoginPayload, LoginResponse, RegisterPayload } from "./auth";

