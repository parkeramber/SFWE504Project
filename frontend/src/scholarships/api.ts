// frontend/src/scholarships/api.ts
import api from "../api/client";

export type Scholarship = {
  id: number;
  name: string;
  description: string;
  amount: number;
  deadline: string;      // ISO string from backend
  requirements: string;
  min_gpa?: number | null;
  required_citizenship?: string | null;
  required_major?: string | null;
  required_minor?: string | null;

  // NEW flags from backend
  requires_essay: boolean;
  requires_transcript: boolean;
  requires_questions: boolean;
};

export type ScholarshipInput = {
  name: string;
  description: string;
  amount: number;
  deadline: string;      // "YYYY-MM-DD" for <input type="date" />
  requirements: string;
  min_gpa?: number | null;
  required_citizenship?: string | null;
  required_major?: string | null;
  required_minor?: string | null;

  // optional on create/edit (backend has defaults)
  requires_essay?: boolean;
  requires_transcript?: boolean;
  requires_questions?: boolean;
};

export async function listScholarships(): Promise<Scholarship[]> {
  const res = await api.get<Scholarship[]>("/scholarships/");
  return res.data;
}

export async function searchScholarships(keyword: string): Promise<Scholarship[]> {
  const res = await api.get<Scholarship[]>("/scholarships/search", {
    params: { keyword },
  });
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
