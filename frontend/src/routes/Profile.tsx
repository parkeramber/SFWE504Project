import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe, updateProfile, changePassword, refreshSession } from "../auth/api";
import { clearTokens, loadTokens, saveTokens } from "../auth/session";
import type { User } from "../auth/types";
import Notification from "../components/Notification";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const navigate = useNavigate();

  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      navigate("/login", { replace: true });
      return;
    }
    const hydrate = async () => {
      try {
        const me = await fetchMe(tokens.accessToken);
        setUser(me);
        setFirstName(me.first_name ?? "");
        setLastName(me.last_name ?? "");
      } catch {
        try {
          const refreshed = await refreshSession(tokens.refreshToken);
          saveTokens(refreshed);
          const me = await fetchMe(refreshed.accessToken);
          setUser(me);
          setFirstName(me.first_name ?? "");
          setLastName(me.last_name ?? "");
        } catch (err: any) {
          clearTokens();
          navigate("/login", { replace: true });
        }
      }
    };
    void hydrate();
  }, [navigate]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    const tokens = loadTokens();
    if (!tokens) return;
    setStatus(null);
    setError(null);
    try {
      const updated = await updateProfile(tokens.accessToken, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });
      setUser(updated);
      window.dispatchEvent(new CustomEvent("eduaid:user-updated", { detail: updated }));
      setStatus("Profile updated");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Update failed");
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    const tokens = loadTokens();
    if (!tokens) return;
    setStatus(null);
    setError(null);
    try {
      await changePassword(tokens.accessToken, { currentPassword: pwdCurrent, newPassword: pwdNew });
      setStatus("Password changed");
      setPwdCurrent("");
      setPwdNew("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Password change failed");
    }
  };

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
          <button
            type="button"
            className={activeTab === "password" ? "active" : ""}
            onClick={() => setActiveTab("password")}
          >
            Change password
          </button>
        </div>

        {activeTab === "profile" ? (
          <form className="profile-section" onSubmit={handleProfileSave}>
            <label>
              Email
              <input type="email" value={user?.email || ""} disabled />
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
        ) : (
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
      </div>
    </div>
  );
}
