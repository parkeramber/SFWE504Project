// frontend/src/components/dashboard/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

import { fetchMe } from "../../auth/api";
import type { User } from "../../auth/types";
import {
  listScholarships,
  searchScholarships,
  type Scholarship,
} from "../../scholarships/api";

function formatDeadline(deadline: string) {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return deadline;
  return d.toLocaleDateString();
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);

  // initial load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const me = await fetchMe();
        if (!me || cancelled) return;

        setUser(me);

        const data = await listScholarships();
        if (!cancelled) {
          setScholarships(data);
        }
      } catch (err) {
        console.error("Error loading dashboard", err);
        if (!cancelled) {
          setError("Failed to load dashboard data.");
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
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const term = searchTerm.trim();
    setError(null);

    // empty search → show all
    if (!term) {
      try {
        setSearching(true);
        const data = await listScholarships();
        setScholarships(data);
      } catch (err) {
        console.error("Error reloading scholarships", err);
        setError("Failed to load scholarships.");
      } finally {
        setSearching(false);
      }
      return;
    }

    try {
      setSearching(true);
      const data = await searchScholarships(term);
      setScholarships(data);
    } catch (err) {
      console.error("Error searching scholarships", err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function renderSearchBar() {
    return (
      <form className="dashboard-search" onSubmit={handleSearch}>
        <input
          type="text"
          className="dashboard-search-input"
          placeholder="Search scholarships…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="dashboard-search-button"
          disabled={searching}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="dashboard">
        <p className="dashboard-error">{error}</p>
      </div>
    );
  }

  if (!user) {
    // fetchMe will have logged out if token was bad
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2 className="dashboard-title">
          Welcome, {user.first_name} {user.last_name}
        </h2>
        <p className="dashboard-subtitle">
          Role: <strong>{user.role}</strong>
        </p>
      </header>

      {/* APPLICANT VIEW */}
      {user.role === "applicant" && (
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">Available Scholarships</h3>

          {renderSearchBar()}

          {error && <p className="dashboard-error">{error}</p>}

          {scholarships.length === 0 ? (
            <p>No scholarships available yet.</p>
          ) : (
            <div className="dashboard-list">
              {scholarships.map((sch) => (
                <div key={sch.id} className="dashboard-card">
                  <h3>{sch.name}</h3>
                  <p>{sch.description}</p>
                  <div className="dashboard-meta">
                    <span>Amount: ${sch.amount}</span>
                    <span>Deadline: {formatDeadline(sch.deadline)}</span>
                  </div>
                  <p className="dashboard-reqs">
                    <strong>Requirements:</strong> {sch.requirements}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ENGR ADMIN VIEW */}
      {user.role === "engr_admin" && (
        <section className="dashboard-section dashboard-section--admin">
          <div className="dashboard-card dashboard-card--admin">
            <h3 className="dashboard-section-title">Admin Panel</h3>
            <p className="dashboard-text">
              As an ENGR Admin, you can manage scholarships, users, and reports.
            </p>

            <div className="dashboard-admin-actions">
              <button
                className="dashboard-chip dashboard-chip--disabled"
                type="button"
                disabled
              >
                User Edit / Create / Delete
              </button>

              <Link className="dashboard-chip" to="/admin/scholarships">
                Application Edit / Create / Delete
              </Link>

              <button
                className="dashboard-chip dashboard-chip--disabled"
                type="button"
                disabled
              >
                Disbursement Controls
              </button>

              <Link className="dashboard-chip" to="/admin/reports">
                Reports &amp; Analytics
              </Link>

              <button
                className="dashboard-chip dashboard-chip--disabled"
                type="button"
                disabled
              >
                User Password Management
              </button>
              <button
                className="dashboard-chip dashboard-chip--secondary dashboard-chip--disabled"
                type="button"
                disabled
              >
                Help &amp; Documentation
              </button>
            </div>

            <h4 className="dashboard-section-subtitle">All Scholarships</h4>

            {renderSearchBar()}

            {error && <p className="dashboard-error">{error}</p>}

            {scholarships.length === 0 ? (
              <p>No scholarships created yet.</p>
            ) : (
              <ul className="dashboard-admin-list">
                {scholarships.map((sch) => (
                  <li key={sch.id} className="dashboard-admin-item">
                    <span>{sch.name}</span>
                    <span>Deadline: {formatDeadline(sch.deadline)}</span>
                    <span>${sch.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* REVIEWER VIEW */}
      {user.role === "reviewer" && (
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">Reviewer Panel</h3>
          <p className="dashboard-text">
            Assigned applications will appear here in a future update.
          </p>
          {renderSearchBar()}
        </section>
      )}

      {/* SPONSOR / DONOR VIEW */}
      {user.role === "sponsor_donor" && (
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">Sponsor/Donor Portal</h3>
          <p className="dashboard-text">
            Donation history, sponsored scholarships, and student stats will
            appear here.
          </p>
          {renderSearchBar()}
        </section>
      )}

      {/* STEWARD VIEW */}
      {user.role === "steward" && (
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">Steward Portal</h3>
          <p className="dashboard-text">
            Stewardship responsibilities and workflow will appear here.
          </p>
          {renderSearchBar()}
        </section>
      )}
    </div>
  );
}
