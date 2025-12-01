// frontend/src/applications/api.ts
import api from "../api/client";

export interface ApplicationCreateInput {
  user_id: number;
  scholarship_id: number;
  essay_text?: string | null;
  transcript_url?: string | null;
  answers_json?: string | null;
}

export async function createApplication(input: ApplicationCreateInput) {
  const res = await api.post("/applications/", input);
  return res.data;
}
