import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe } from "../auth/api";
import { loadTokens, saveTokens } from "../auth/session";
import type { User } from "../auth/types";
import {
  fetchApplicantProfile,
  upsertApplicantProfile,
} from "../applicant/api";
import type { ApplicantProfilePayload } from "../applicant/types";
import Notification from "../components/Notification";

export default function ApplicantOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [netId, setNetId] = useState("");
  const [degreeMajor, setDegreeMajor] = useState("");
  const [degreeMinor, setDegreeMinor] = useState("");
  const [gpa, setGpa] = useState("");
  const [academicAchievements, setAcademicAchievements] = useState("");
  const [financialInformation, setFinancialInformation] = useState("");
  const [writtenEssays, setWrittenEssays] = useState("");

  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      navigate("/login", { replace: true });
      return;
    }

    const bootstrap = async () => {
      try {
        const me = await fetchMe(tokens.accessToken);
        if (!me) {
          navigate("/login", { replace: true });
          return;
        }

        setUser(me);
        setFirstName(me.first_name ?? "");
        setLastName(me.last_name ?? "");

        try {
          const profile = await fetchApplicantProfile(tokens.accessToken);
          setStudentId(profile.student_id);
          setNetId(profile.netid);
          setDegreeMajor(profile.degree_major);
          setDegreeMinor(profile.degree_minor ?? "");
          setGpa(
            profile.gpa !== null && profile.gpa !== undefined
              ? String(profile.gpa)
              : "",
          );
          setAcademicAchievements(profile.academic_achievements ?? "");
          setFinancialInformation(profile.financial_information ?? "");
          setWrittenEssays(profile.written_essays ?? "");

          if (tokens.needsProfileSetup) {
            saveTokens({ ...tokens, needsProfileSetup: false });
          }
          setStatus("Profile on file. Update any field and save to continue.");
        } catch (err: any) {
          if (!axios.isAxiosError(err) || err.response?.status !== 404) {
            setError("Could not load your applicant profile.");
          }
        }
      } catch (err) {
        console.error("Error loading onboarding data", err);
        setError("Could not load account information.");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [navigate]);

  useEffect(() => {
    if (user && user.role !== "applicant") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokens = loadTokens();
    if (!tokens) {
      navigate("/login", { replace: true });
      return;
    }

    const gpaNumber = Number(gpa);
    if (Number.isNaN(gpaNumber) || gpaNumber < 0 || gpaNumber > 4) {
      setError("Enter a GPA between 0.00 and 4.00.");
      return;
    }

    const payload: ApplicantProfilePayload = {
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      student_id: studentId.trim(),
      netid: netId.trim(),
      degree_major: degreeMajor.trim(),
      degree_minor: degreeMinor.trim() || undefined,
      gpa: gpaNumber,
      academic_achievements: academicAchievements.trim() || undefined,
      financial_information: financialInformation.trim() || undefined,
      written_essays: writtenEssays.trim() || undefined,
    };

    setSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      await upsertApplicantProfile(tokens.accessToken, payload);
      saveTokens({ ...tokens, needsProfileSetup: false });
      setStatus("Profile saved. You can proceed to the dashboard.");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Error saving applicant profile", err);
      const detail = err?.response?.data?.detail;
      setError(detail || "Could not save applicant profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading onboarding form...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Applicant onboarding</h2>
        <p className="dashboard-text">
          We need a few details before you start applying for scholarships.
        </p>

        <form className="profile-section" onSubmit={handleSubmit}>
          <label>
            First name
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
            />
          </label>
          <label>
            Student ID
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 12345678"
              required
            />
          </label>
          <label>
            NetID
            <input
              type="text"
              value={netId}
              onChange={(e) => setNetId(e.target.value)}
              placeholder="abc123"
              required
            />
          </label>
          <label>
            Degree major
            <input
              type="text"
              value={degreeMajor}
              onChange={(e) => setDegreeMajor(e.target.value)}
              placeholder="Computer Engineering"
              required
            />
          </label>
          <label>
            Degree minor (optional)
            <input
              type="text"
              value={degreeMinor}
              onChange={(e) => setDegreeMinor(e.target.value)}
              placeholder="Mathematics"
            />
          </label>
          <label>
            GPA
            <input
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              placeholder="e.g. 3.75"
              required
            />
          </label>
          <label>
            Academic achievements
            <textarea
              value={academicAchievements}
              onChange={(e) => setAcademicAchievements(e.target.value)}
              placeholder="Dean's list, research, awards..."
              rows={3}
            />
          </label>
          <label>
            Financial information
            <textarea
              value={financialInformation}
              onChange={(e) => setFinancialInformation(e.target.value)}
              placeholder="Scholarship needs, aid status, circumstances..."
              rows={3}
            />
          </label>
          <label>
            Written essays
            <textarea
              value={writtenEssays}
              onChange={(e) => setWrittenEssays(e.target.value)}
              placeholder="Paste any prepared essays or notes."
              rows={4}
            />
          </label>

          <div className="profile-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save and continue"}
            </button>
          </div>
        </form>

        {(status || error) && (
          <Notification
            kind={error ? "error" : "success"}
            message={error || status || ""}
            onClose={() => {
              setStatus(null);
              setError(null);
            }}
            autoHideMs={3000}
          />
        )}
      </div>
    </div>
  );
}
