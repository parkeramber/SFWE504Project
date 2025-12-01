// frontend/src/routes/AdminReportsGUI.tsx
import { useEffect, useState } from "react";

import { fetchMe } from "../auth/api";
import { loadTokens, clearTokens } from "../auth/session";
import type { User } from "../auth/types";
import { fetchAdminSummary, type AdminSummary } from "../admin/api";

export default function AdminReportsGUI() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      setError("No active session.");
      setLoading(false);
      return;
    }

    const hydrate = async () => {
      try {
        // 1) Get user
        const me = await fetchMe(tokens.accessToken);
        setUser(me);

        // 2) Get admin summary
        const data = await fetchAdminSummary();
        setSummary(data);
      } catch (err: any) {
        console.error("Error loading admin reports", err);
        const status = err?.response?.status;
        if (status === 401) {
          clearTokens();
          setError("Session expired. Please log in again.");
        } else if (status === 404) {
          setError("Admin summary endpoint not found. Check backend routes.");
        } else {
          setError("Failed to load admin reports.");
        }
      } finally {
        setLoading(false);
      }
    };

    void hydrate();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2>Admin Reports</h2>

        {error && <p className="dashboard-error">{error}</p>}
        {loading && !error && <p>Loading reports...</p>}

        {!loading && !error && !user && (
          <p className="dashboard-error">
            You must be logged in to view this page.
          </p>
        )}

        {!loading && !error && user && summary && (
          <>
            <p className="lead-text">
              Reports and analytics for the application process.
            </p>

            <h3>Overall Summary</h3>
            <table className="reports-table">
              <tbody>
                <tr>
                  <th>Total users</th>
                  <td>{summary.total_users}</td>
                </tr>
                <tr>
                  <th>Total scholarships</th>
                  <td>{summary.total_scholarships}</td>
                </tr>
                <tr>
                  <th>Total applicants</th>
                  <td>{summary.total_applicants}</td>
                </tr>
                <tr>
                  <th>Total applications</th>
                  <td>{summary.total_applications}</td>
                </tr>
              </tbody>
            </table>

            <p className="lead-text">
              Additional reports (demographics, impact) will be added in future
              iterations.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
