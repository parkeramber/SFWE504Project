import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, refreshSession } from "../auth/api";
import { loadTokens, saveTokens, clearTokens } from "../auth/session";
import type { User } from "../auth/types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      setError("No active session.");
      return;
    }

    const hydrate = async () => {
      try {
        const me = await fetchMe(tokens.accessToken);
        setUser(me);
      } catch {
        try {
          const refreshed = await refreshSession(tokens.refreshToken);
          saveTokens(refreshed);
          const me = await fetchMe(refreshed.accessToken);
          setUser(me);
        } catch (err: any) {
          clearTokens();
          setError(err?.response?.data?.detail || "Session expired, please log in again.");
        }
      }
    };

    void hydrate();
  }, []);
  const handleTransition = () => {
    navigate("/login", { replace: true });
  };
  const reportTransition = () => {
    navigate("/AdminReports", { replace: true });
  };

  let content = null;
  if (user) {
      if (user.role === 'applicant'){
      content = (
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          {error && <p>{error}</p>}
          {!error && user ? (
            <>
              <p className="lead-text">
                Welcome{" "}
                {user.first_name || user.last_name
                  ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                  : user.email}
              </p>
              <p>Role: Applicant</p>
              <p>This is a placeholder protected view.</p>
            </>
          ) : null}
          {!error && !user && <p>Loading user...</p>}
        </div>
      );
    }
    else if (user.role === 'engr_admin'){
      content = (
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          {error && <p>{error}</p>}
          {!error && user ? (
            <>
              <p className="lead-text">
                Welcome{" "}
                {user.first_name || user.last_name
                  ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                  : user.email}
              </p>
              <p>Role: ENGR Admin</p>
              <div className="token-actions">
              <button
              type="button"
              className="profile-section"
              onClick={handleTransition}
              >User Edit/Create/Delete</button>
              </div>
              <div className="token-actions">
              <button
              type="button"
              className="profile-section"
              onClick={handleTransition}
              >Application Edit/Create/Delete</button>
              </div>
              <div className="token-actions">
              <button
              type="button"
              className="profile-section"
              onClick={handleTransition}
              >Help</button>
              </div>
              <div className="token-actions">
              <button
              type="button"
              className="profile-section"
              onClick={handleTransition}
              >Disbursement Controls</button>
              </div>
              <div className="token-actions">
              <button
              type="button"
              className="profile-section"
              onClick={reportTransition}
              >Reports</button>
              </div>
              <div className="token-actions">
              <button
              type="button"
              className="profile-section"
              onClick={handleTransition}
              >User Password Management</button>
              </div>
            </>
          ) : null}
          {!error && !user && <p>Loading user...</p>}
        </div>
      );
    }
    else if (user.role === 'reviewer'){
      content = (
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          {error && <p>{error}</p>}
          {!error && user ? (
            <>
              <p className="lead-text">
                Welcome{" "}
                {user.first_name || user.last_name
                  ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                  : user.email}
              </p>
              <p>Role: Reviewer</p>
              <p>This is a placeholder protected view.</p>
            </>
          ) : null}
          {!error && !user && <p>Loading user...</p>}
        </div>
      );
    }
    else if (user.role === 'sponsor_donor'){
      content = (
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          {error && <p>{error}</p>}
          {!error && user ? (
            <>
              <p className="lead-text">
                Welcome{" "}
                {user.first_name || user.last_name
                  ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                  : user.email}
              </p>
              <p>Role: Sponsor/Donor</p>
              <p>This is a placeholder protected view.</p>
            </>
          ) : null}
          {!error && !user && <p>Loading user...</p>}
        </div>
      );
    }else if (user.role === 'steward'){
      content = (
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          {error && <p>{error}</p>}
          {!error && user ? (
            <>
              <p className="lead-text">
                Welcome{" "}
                {user.first_name || user.last_name
                  ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                  : user.email}
              </p>
              <p>Role: Steward</p>
              <p>This is a placeholder protected view.</p>
            </>
          ) : null}
          {!error && !user && <p>Loading user...</p>}
        </div>
      );
    }
  }
  else {
    content = (
        <div className="dashboard-card">
          <h2>How'd you manage this?</h2>
        </div>
      );
  }
  return <div className="dashboard-page">{content}</div>;
}
