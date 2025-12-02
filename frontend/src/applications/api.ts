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

// Notifications
export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function listNotificationsForUser(
  userId: number,
): Promise<Notification[]> {
  const res = await api.get(`/notifications/user/${userId}`);
  return res.data as Notification[];
}

export async function markNotificationRead(
  notificationId: number,
): Promise<Notification> {
  const res = await api.post(`/notifications/${notificationId}/read`);
  return res.data as Notification;
}

// Applicant profile (for reviewer/admin)
export interface ApplicantProfile {
  id: number;
  user_id: number;
  student_id: string;
  netid: string;
  degree_major: string;
  degree_minor?: string | null;
  gpa?: number | null;
  academic_achievements?: string | null;
  financial_information?: string | null;
  written_essays?: string | null;
}

export async function fetchApplicantProfileByUser(
  userId: number,
): Promise<ApplicantProfile> {
  const res = await api.get(`/applicant/profile/by-user/${userId}`);
  return res.data as ApplicantProfile;
}

// Suitability
export interface SuitabilityResult {
  status: "qualified" | "unqualified" | "unknown";
  notes: string[];
}

export async function fetchSuitability(
  applicationId: number,
): Promise<SuitabilityResult> {
  const res = await api.get(`/applications/${applicationId}/suitability`);
  return res.data as SuitabilityResult;
}
