// frontend/src/admin/api.ts
import api from "../api/client";

export type AdminSummary = {
  total_users: number;
  total_scholarships: number;
  total_applicants: number;
  total_applications: number;
};

export async function fetchAdminSummary(): Promise<AdminSummary> {
  const res = await api.get<AdminSummary>("/admin/summary");
  return res.data;
}
