# API Services

This directory contains all API service modules. **All API calls must go through these services.**

## Structure

- `users.ts` - User management API calls
- `penalties.ts` - Penalty management API calls
- `activities.ts` - Activity management API calls
- `expenses.ts` - Expense management API calls
- `logs.ts` - Log management API calls
- `tiers.ts` - Tier management API calls
- `index.ts` - Central export for all services

## Usage

### ✅ Correct - Use API Services

```typescript
import { usersApi, penaltiesApi } from "@/api";
import { useQuery, useMutation } from "@tanstack/react-query";

// In a component
const usersQuery = useQuery({
  queryKey: ["users"],
  queryFn: () => usersApi.getAll(),
});

const createPenaltyMutation = useMutation({
  mutationFn: (payload) => penaltiesApi.create(payload),
});
```

### ❌ Incorrect - Direct apiClient Usage

```typescript
import apiClient from "@/lib/apiClient"; // ❌ Don't do this in components

// ❌ Don't make direct API calls in components
const response = await apiClient.get("/users");
```

## Rules

1. **Never import `apiClient` directly in components or pages**
2. **Always use the API services from `@/api`**
3. **Add new API endpoints to the appropriate service file**
4. **Export new services through `index.ts`**

## Adding New Endpoints

When adding a new endpoint:

1. Add the method to the appropriate service file
2. Include JSDoc comments explaining the method
3. Export any new types/interfaces
4. Update this README if adding a new service

## Example: Adding a New Endpoint

```typescript
// In src/api/penalties.ts
export const penaltiesApi = {
  // ... existing methods

  /**
   * Mark penalty as paid
   */
  markAsPaid: async (id: string): Promise<Penalty> => {
    const response = await apiClient.patch<Penalty>(`/penalties/${id}/pay`, {});
    return response.data;
  },
};
```

