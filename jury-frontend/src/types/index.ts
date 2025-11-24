export interface User {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "JURY";
  createdAt: string;
}

export interface Penalty {
  id: string;
  userId: string;
  category: string;
  reason: string;
  description?: string | null;
  amount: number;
  status: string;
  date: string;
  createdAt: string;
  user?: User;
}

export interface CreatePenaltyPayload {
  userId: string;
  category: string;
  reason: string;
  description?: string;
  amount: number;
  status?: string;
  date?: string;
}

export interface UpdatePenaltyPayload extends CreatePenaltyPayload {
  id: string;
}

