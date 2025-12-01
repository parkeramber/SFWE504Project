export type ApplicantProfile = {
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
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApplicantProfilePayload = {
  first_name?: string;
  last_name?: string;
  student_id: string;
  netid: string;
  degree_major: string;
  degree_minor?: string;
  gpa?: number;
  academic_achievements?: string;
  financial_information?: string;
  written_essays?: string;
};
