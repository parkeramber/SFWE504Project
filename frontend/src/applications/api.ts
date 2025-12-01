// frontend/src/applications/api.ts
import api from "../api/client";

export interface ApplicationCreateInput {
  user_id: number;
  scholarship_id: number;
  essay_text?: string | null;
  transcript_url?: string | null;
  answers_json?: string | null;
}

export interface Application {
  id: number;
  user_id: number;
  scholarship_id: number;
  status: string;
  essay_text?: string | null;
  transcript_url?: string | null;
  answers_json?: string | null;
  created_at?: string;
}

export async function createApplication(
  input: ApplicationCreateInput,
): Promise<Application> {
  const res = await api.post("/applications/", input);
  return res.data as Application;
}

export async function listApplicationsForUser(
  userId: number,
): Promise<Application[]> {
  const res = await api.get(`/applications/by-user/${userId}`);
  return res.data as Application[];
}
