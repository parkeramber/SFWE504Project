// frontend/src/admin/api.ts
import api from "../api/client";

export type AdminSummary = {
  total_users: number;
  total_scholarships: number;
  total_applicants: number;
  total_applications: number;
  qualified_by_scholarship?: Record<string, number>;
  total_reviewers?: number;
  total_admins?: number;
  total_stewards?: number;
  total_sponsors?: number;
};

export type AdminUser = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  is_active: boolean;
};

export async function fetchAdminSummary(accessToken?: string): Promise<AdminSummary> {
  const token = accessToken ?? loadAccessToken();
  const res = await api.get<AdminSummary>("/admin/summary", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
}

function loadAccessToken(): string | undefined {
  try {
    const stored = localStorage.getItem("tokens");
    if (!stored) return undefined;
    const parsed = JSON.parse(stored);
    return parsed?.accessToken;
  } catch {
    return undefined;
  }
}

export async function fetchQualifiedByScholarship(
  accessToken: string,
  scholarshipId: number,
) {
  const res = await api.get(`/scholarships/${scholarshipId}/qualified`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data as any[];
}

export async function listUsers(accessToken: string): Promise<AdminUser[]> {
  const res = await api.get<AdminUser[]>("/admin/users", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function updateUserAdmin(
  accessToken: string,
  userId: number,
  payload: Partial<Pick<AdminUser, "first_name" | "last_name" | "role" | "is_active">>,
): Promise<AdminUser> {
  const res = await api.patch<AdminUser>(`/admin/users/${userId}`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function deleteUserAdmin(accessToken: string, userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
