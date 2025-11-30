// frontend/src/scholarships/api.ts
import api from "../api/client";

export type Scholarship = {
  id: number;
  name: string;
  description: string;
  amount: number;
  deadline: string;
  requirements: string;
};

export async function searchScholarships(keyword: string): Promise<Scholarship[]> {
  const res = await api.get<Scholarship[]>("/scholarships/search", {
    params: { keyword },
  });
  return res.data;
}

export type ScholarshipInput = {
  name: string;
  description: string;
  amount: number;
  deadline: string;
  requirements: string;
};

export async function listScholarships(): Promise<Scholarship[]> {
  const res = await api.get<Scholarship[]>("/scholarships/");
  return res.data;
}

export async function createScholarship(
  payload: ScholarshipInput,
): Promise<Scholarship> {
  const res = await api.post<Scholarship>("/scholarships/", payload);
  return res.data;
}

export async function updateScholarship(
  id: number,
  payload: ScholarshipInput,
): Promise<Scholarship> {
  const res = await api.put<Scholarship>(`/scholarships/${id}`, payload);
  return res.data;
}

export async function deleteScholarship(id: number): Promise<void> {
  await api.delete(`/scholarships/${id}`);
}
