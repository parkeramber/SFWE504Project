import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe, updateProfile, changePassword } from "../auth/api";
import { loadTokens, saveTokens } from "../auth/session";
import type { User } from "../auth/types";
import { fetchApplicantProfile, upsertApplicantProfile } from "../applicant/api";
import Notification from "../components/Notification";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [netId, setNetId] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [degreeMajor, setDegreeMajor] = useState("");
  const [degreeMinor, setDegreeMinor] = useState("");
  const [gpa, setGpa] = useState("");
  const [academicAchievements, setAcademicAchievements] = useState("");
  const [financialInformation, setFinancialInformation] = useState("");
  const [writtenEssays, setWrittenEssays] = useState("");
  const [citizenshipConfirmed, setCitizenshipConfirmed] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "applicant" | "password">("profile");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const me = await fetchMe(); // no args – uses central token logic

        if (cancelled) return;

        // If fetchMe returns null, session is gone
        if (!me) {
          navigate("/login", { replace: true });
          return;
        }

        setUser(me);
        setFirstName(me.first_name ?? "");
        setLastName(me.last_name ?? "");

        if (me.role === "applicant") {
          const tokens = loadTokens();
          if (tokens) {
            try {
              const profile = await fetchApplicantProfile(tokens.accessToken);
              setStudentId(profile.student_id);
              setNetId(profile.netid);
              setCitizenship(profile.citizenship ?? "");
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
              setCitizenshipConfirmed(false);
            } catch (err: any) {
              const detail = err?.response?.data?.detail;
              if (detail && detail !== "Applicant profile not found") {
                console.error("Error loading applicant profile", err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading profile", err);
        if (!cancelled) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();

    const tokens = loadTokens();
    if (!tokens) {
      navigate("/login", { replace: true });
      return;
    }

    setStatus(null);
    setError(null);

    try {
      const updated = await updateProfile(tokens.accessToken, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });
      setUser(updated);
      window.dispatchEvent(
        new CustomEvent("eduaid:user-updated", { detail: updated }),
      );
      setStatus("Profile updated");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Update failed");
    }
  };

  const handleApplicantProfileSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const tokens = loadTokens();
    if (!tokens) {
      navigate("/login", { replace: true });
      return;
    }

    if (!citizenship.trim()) {
      setAppError("Citizenship is required for eligibility checks.");
      return;
    }

    if (!citizenshipConfirmed) {
      setAppError("Please confirm your citizenship information is accurate.");
      return;
    }

    const gpaNumber = Number(gpa);
    if (Number.isNaN(gpaNumber) || gpaNumber < 0 || gpaNumber > 4) {
      setAppError("Enter a GPA between 0.00 and 4.00.");
      return;
    }

    setAppStatus(null);
    setAppError(null);

    try {
      await upsertApplicantProfile(tokens.accessToken, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        student_id: studentId,
        netid: netId,
        citizenship: citizenship || undefined,
        degree_major: degreeMajor,
        degree_minor: degreeMinor || undefined,
        gpa: gpaNumber,
        academic_achievements: academicAchievements || undefined,
        financial_information: financialInformation || undefined,
        written_essays: writtenEssays || undefined,
      });

      // Ensure onboarding flag is cleared if it existed
      saveTokens({ ...tokens, needsProfileSetup: false });

      setAppStatus("Applicant information saved");
      setCitizenshipConfirmed(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setAppError(detail || "Applicant info update failed");
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();

    const tokens = loadTokens();
    if (!tokens) {
      navigate("/login", { replace: true });
      return;
    }

    setStatus(null);
    setError(null);

    if (pwdNew !== pwdConfirm) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await changePassword(tokens.accessToken, {
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      setStatus("Password changed");
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Password change failed");
    }
  };

  if (loading && !user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // fetchMe already handled logout / redirect
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>My Profile</h2>
        <div className="profile-tabs">
          <button
            type="button"
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          {user.role === "applicant" && (
            <button
              type="button"
              className={activeTab === "applicant" ? "active" : ""}
              onClick={() => setActiveTab("applicant")}
            >
              Applicant details
            </button>
          )}
          <button
            type="button"
            className={activeTab === "password" ? "active" : ""}
            onClick={() => setActiveTab("password")}
          >
            Change password
          </button>
        </div>

        {activeTab === "profile" && (
          <form className="profile-section" onSubmit={handleProfileSave}>
            <label>
              Email
              <input type="email" value={user.email} disabled />
            </label>
            <label>
              First name
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </label>
            <button type="submit">Save profile</button>
          </form>
        )}

        {activeTab === "applicant" && user.role === "applicant" && (
          <form className="profile-section" onSubmit={handleApplicantProfileSave}>
            <label>
              Student ID
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Student ID"
                required
              />
            </label>
            <label>
              NetID
              <input
                type="text"
                value={netId}
                onChange={(e) => setNetId(e.target.value)}
                placeholder="NetID"
                required
              />
            </label>
            <label>
              Citizenship
              <input
                type="text"
                value={citizenship}
                onChange={(e) => setCitizenship(e.target.value)}
                placeholder="Citizenship"
                required
              />
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={citizenshipConfirmed}
                onChange={(e) => setCitizenshipConfirmed(e.target.checked)}
                required
              />
              I confirm my citizenship information is accurate.
            </label>
            <label>
              Degree major
              <input
                type="text"
                value={degreeMajor}
                onChange={(e) => setDegreeMajor(e.target.value)}
                placeholder="Degree major"
                required
              />
            </label>
            <label>
              Degree minor (optional)
              <input
                type="text"
                value={degreeMinor}
                onChange={(e) => setDegreeMinor(e.target.value)}
                placeholder="Degree minor"
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
                placeholder="e.g. 3.80"
                required
              />
            </label>
            <label>
              Academic achievements
              <textarea
                value={academicAchievements}
                onChange={(e) => setAcademicAchievements(e.target.value)}
                placeholder="Dean's list, awards, research, etc."
                rows={3}
              />
            </label>
            <label>
              Financial information
              <textarea
                value={financialInformation}
                onChange={(e) => setFinancialInformation(e.target.value)}
                placeholder="Aid status, needs, circumstances..."
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
            <button type="submit">Save applicant info</button>
          </form>
        )}

        {activeTab === "password" && (
          <form className="profile-section" onSubmit={handlePasswordChange}>
            <label>
              Current password
              <input
                type="password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                placeholder="Current password"
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                placeholder="New password"
                required
              />
            </label>
            <label>
              Re-type new password
              <input
                type="password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                placeholder="Re-type new password"
                required
              />
            </label>
            <button type="submit">Update password</button>
          </form>
        )}

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

        {(appStatus || appError) && (
          <Notification
            kind={appError ? "error" : "success"}
            message={appError || appStatus || ""}
            onClose={() => {
              setAppStatus(null);
              setAppError(null);
            }}
            autoHideMs={3000}
          />
        )}
      </div>
    </div>
  );
}
