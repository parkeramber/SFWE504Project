import api from "../api/client";
import type { ApplicantProfile, ApplicantProfilePayload } from "./types";

export async function fetchApplicantProfile(
  accessToken: string,
): Promise<ApplicantProfile> {
  const res = await api.get<ApplicantProfile>("/applicant/profile/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function upsertApplicantProfile(
  accessToken: string,
  payload: ApplicantProfilePayload,
): Promise<ApplicantProfile> {
  const res = await api.put<ApplicantProfile>("/applicant/profile/me", payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}
