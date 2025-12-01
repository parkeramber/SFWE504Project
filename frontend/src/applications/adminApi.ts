import api from "../api/client";

export async function listAllApplications() {
  const res = await api.get("/applications/");
  return res.data;
}

export async function assignReviewer(applicationId: number, reviewerId: number) {
  const res = await api.put(`/applications/${applicationId}/assign`, {
    reviewer_id: reviewerId,
  });
  return res.data;
}
