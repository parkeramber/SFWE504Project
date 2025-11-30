// FRONTEND: src/scholarships/api.ts
import api from "../api/client";
import { loadTokens } from "../auth/session";

export type Scholarship = {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  deadline: string;       // ISO date from backend
  requirements: string | null;
};

export type ScholarshipCreateInput = {
  name: string;
  description: string | null;
  amount: number;
  deadline: string;       // "YYYY-MM-DD"
  requirements: string | null;
};

export async function listScholarships(): Promise<Scholarship[]> {
  const res = await api.get<Scholarship[]>("/scholarships/");
  return res.data;
}

export async function createScholarship(payload: ScholarshipCreateInput): Promise<Scholarship> {
  const tokens = loadTokens();
  // even though backend is currently “open”, we’ll still send auth
  const res = await api.post<Scholarship>("/scholarships/", payload, {
    headers: tokens
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : undefined,
  });
  return res.data;
}
