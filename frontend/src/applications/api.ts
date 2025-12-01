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
  reviewer_id?: number | null;
  essay_text?: string | null;
  transcript_url?: string | null;
  answers_json?: string | null;
  created_at?: string;
}

export interface ReviewInput {
  reviewer_id: number;
  score?: number | null;
  comment?: string | null;
  status?: "in_review" | "accepted" | "rejected";
}

export interface Review {
  id: number;
  application_id: number;
  reviewer_id: number;
  score?: number | null;
  comment?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}


// ----------------------
// EXISTING FUNCTIONS
// ----------------------

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

// Admin: list all applications
export async function listAllApplications(): Promise<Application[]> {
  const res = await api.get("/applications/");
  return res.data as Application[];
}

// Admin: assign a reviewer
export async function assignReviewerToApplication(
  applicationId: number,
  reviewerId: number,
): Promise<Application> {
  const res = await api.post(
    `/applications/${applicationId}/assign-reviewer/${reviewerId}`,
  );
  return res.data as Application;
}

// Reviewer: see what’s assigned to them
export async function listApplicationsAssignedToReviewer(
  reviewerId: number,
): Promise<Application[]> {
  const res = await api.get(`/applications/assigned/${reviewerId}`);
  return res.data as Application[];
}

// Reviewer: create or update a review
export async function submitReview(
  applicationId: number,
  input: ReviewInput,
): Promise<Review> {
  const res = await api.post(`/applications/${applicationId}/reviews`, input);
  return res.data as Review;
}

export async function listReviewsForApplication(
  applicationId: number,
): Promise<Review[]> {
  const res = await api.get(`/applications/${applicationId}/reviews`);
  return res.data as Review[];
}

export async function listReviewsByReviewer(
  reviewerId: number,
): Promise<Review[]> {
  const res = await api.get(`/applications/reviews/by-reviewer/${reviewerId}`);
  return res.data as Review[];
}

export async function updateApplicationStatus(
  applicationId: number,
  status: "in_review" | "accepted" | "rejected",
): Promise<Application> {
  const res = await api.patch(`/applications/${applicationId}/status`, {
    status,
  });
  return res.data as Application;
}
