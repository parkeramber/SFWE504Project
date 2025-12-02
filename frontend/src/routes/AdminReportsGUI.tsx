// frontend/src/routes/AdminReportsGUI.tsx
import { useEffect, useState } from "react";

import { fetchMe } from "../auth/api";
import { loadTokens, clearTokens } from "../auth/session";
import type { User } from "../auth/types";
import {
  fetchAdminSummary,
  type AdminSummary,
  fetchQualifiedByScholarship,
} from "../admin/api";
import { listScholarships, type Scholarship } from "../scholarships/api";

export default function AdminReportsGUI() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [qualified, setQualified] = useState<Record<number, number>>({});
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      try {
        // 1) Get user
        const tokens = loadTokens();
        if (!tokens) {
          setError("No active session.");
          setLoading(false);
          return;
        }

        const me = await fetchMe(tokens.accessToken);
        setUser(me);

        // 2) Get admin summary
        const data = await fetchAdminSummary(tokens.accessToken);
        setSummary(data);

        // 3) Load scholarships and qualified counts
        const schList = await listScholarships();
        setScholarships(schList);

        const qualifiedCounts: Record<number, number> = {};
        for (const sch of schList) {
          try {
            const res = await fetchQualifiedByScholarship(
              tokens.accessToken,
              sch.id,
            );
            qualifiedCounts[sch.id] = Array.isArray(res)
              ? res.filter((r) => r.status === "qualified").length
              : 0;
          } catch (err) {
            console.error("Error loading qualified for scholarship", sch.id, err);
          }
        }
        setQualified(qualifiedCounts);
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
                <tr>
                  <th>Total reviewers</th>
                  <td>{summary.total_reviewers ?? 0}</td>
                </tr>
                <tr>
                  <th>Total admins</th>
                  <td>{summary.total_admins ?? 0}</td>
                </tr>
                <tr>
                  <th>Total stewards</th>
                  <td>{summary.total_stewards ?? 0}</td>
                </tr>
                <tr>
                  <th>Total sponsors</th>
                  <td>{summary.total_sponsors ?? 0}</td>
                </tr>
              </tbody>
            </table>

            <p className="lead-text">
              Qualified applicants by scholarship
            </p>

            <table className="reports-table">
              <thead>
                <tr>
                  <th>Scholarship</th>
                  <th>Qualified Applicants</th>
                </tr>
              </thead>
              <tbody>
                {scholarships.map((sch) => (
                  <tr key={sch.id}>
                    <td>{sch.name}</td>
                    <td>{qualified[sch.id] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
