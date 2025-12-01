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
import {
  createApplication,
  listApplicationsForUser,
} from "../../applications/api";


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

  // Application-related state
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [activeScholarship, setActiveScholarship] =
    useState<Scholarship | null>(null);

  // Track scholarships applied to (frontend only)
  const [appliedIds, setAppliedIds] = useState<number[]>([]);

  // Form fields
  const [essayText, setEssayText] = useState("");
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [answers, setAnswers] = useState("");
  const [submittingApp, setSubmittingApp] = useState(false);

  // -------- Initial load --------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const me = await fetchMe();
        if (!me || cancelled) return;

        setUser(me);

        // load scholarships + their applications at the same time
        const [schData, appData] = await Promise.all([
          listScholarships(),
          listApplicationsForUser(me.id),
        ]);

        if (!cancelled) {
          setScholarships(schData);
          // mark already-applied scholarships based on real DB data
          setAppliedIds(appData.map((app) => app.scholarship_id));
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

  // -------- Search handling --------
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const term = searchTerm.trim();
    setError(null);

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

  // -------- Apply flow --------
  const handleApply = (scholarship: Scholarship) => {
    if (!user) return;

    setActiveScholarship(scholarship);
    setEssayText("");
    setTranscriptUrl("");
    setAnswers("");
    setApplyStatus(null);
    setApplyError(null);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeScholarship) return;

    setSubmittingApp(true);
    setApplyStatus(null);
    setApplyError(null);

    try {
      await createApplication({
        user_id: user.id,
        scholarship_id: activeScholarship.id,
        essay_text: activeScholarship.requires_essay ? essayText || null : null,
        transcript_url: activeScholarship.requires_transcript
          ? transcriptUrl || null
          : null,
        answers_json:
          activeScholarship.requires_questions && answers
            ? JSON.stringify({ answers })
            : null,
      });

      // Mark this scholarship as applied (for this session)
      setAppliedIds((prev) =>
        prev.includes(activeScholarship.id)
          ? prev
          : [...prev, activeScholarship.id],
      );

      setApplyStatus(`Application submitted for "${activeScholarship.name}".`);
      setActiveScholarship(null); // close the form
    } catch (err: any) {
      console.error("Error submitting application", err);
      const detail = err?.response?.data?.detail;
      setApplyError(detail || "Could not submit application.");
    } finally {
      setSubmittingApp(false);
    }
  };

  // -------- Loading / no user --------
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

  if (!user) return null;

  // Split scholarships into "available" and "applied" using our local state
  const availableScholarships = scholarships.filter(
    (s) => !appliedIds.includes(s.id),
  );
  const appliedScholarships = scholarships.filter((s) =>
    appliedIds.includes(s.id),
  );

  // -------- Render --------
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

      {/* APPLICANT VIEW – Available scholarships */}
      {user.role === "applicant" && (
        <>
          <section className="dashboard-section">
            <h3 className="dashboard-section-title">Available Scholarships</h3>

            {renderSearchBar()}

            {applyError && <p className="dashboard-error">{applyError}</p>}
            {applyStatus && <p className="dashboard-success">{applyStatus}</p>}

            {error && <p className="dashboard-error">{error}</p>}

            {availableScholarships.length === 0 ? (
              <p>There are no more scholarships to apply for right now.</p>
            ) : (
              <div className="dashboard-list">
                {availableScholarships.map((sch) => (
                  <div key={sch.id} className="dashboard-card">
                    <h3>{sch.name}</h3>
                    <p>{sch.description}</p>

                    <div className="dashboard-badges">
                      {sch.requires_essay && (
                        <span className="badge">Essay required</span>
                      )}
                      {sch.requires_transcript && (
                        <span className="badge">Transcript required</span>
                      )}
                      {sch.requires_questions && (
                        <span className="badge">Extra questions</span>
                      )}
                    </div>

                    <div className="dashboard-meta">
                      <span>Amount: ${sch.amount}</span>
                      <span>Deadline: {formatDeadline(sch.deadline)}</span>
                    </div>

                    <p className="dashboard-reqs">
                      <strong>Requirements:</strong>{" "}
                      {sch.requirements || "See application for details."}
                    </p>

                    <button
                      type="button"
                      className="dashboard-button small"
                      onClick={() => handleApply(sch)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* "My Applications" section */}
          {appliedScholarships.length > 0 && (
            <section className="dashboard-section">
              <h3 className="dashboard-section-title">My Applications</h3>
              <p className="dashboard-text">
                These are the scholarships you’ve applied to in this session.
              </p>
              <ul className="dashboard-admin-list">
                {appliedScholarships.map((sch) => (
                  <li key={sch.id} className="dashboard-admin-item">
                    <span>{sch.name}</span>
                    <span>Deadline: {formatDeadline(sch.deadline)}</span>
                    <span>${sch.amount}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Application form for selected scholarship (applicant view) */}
      {activeScholarship && user.role === "applicant" && (
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">
            Apply to: {activeScholarship.name}
          </h3>

          {applyError && <p className="dashboard-error">{applyError}</p>}
          {applyStatus && <p className="dashboard-success">{applyStatus}</p>}

          <form className="dashboard-form" onSubmit={handleSubmitApplication}>
            {activeScholarship.requires_essay && (
              <div className="dashboard-form-field">
                <label htmlFor="essay">
                  Essay <span className="required">*</span>
                </label>
                <textarea
                  id="essay"
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  rows={6}
                  placeholder="Write your scholarship essay here..."
                  required
                />
                <p className="field-hint">
                  Tip: Most scholarships expect at least 150–250 words.
                </p>
              </div>
            )}

            {activeScholarship.requires_transcript && (
              <div className="dashboard-form-field">
                <label htmlFor="transcript">
                  Transcript link <span className="required">*</span>
                </label>
                <input
                  id="transcript"
                  type="url"
                  value={transcriptUrl}
                  onChange={(e) => setTranscriptUrl(e.target.value)}
                  placeholder="https://example.com/your-transcript.pdf"
                  required
                />
                <p className="field-hint">
                  You can paste a link to a PDF, Google Drive file, or secure
                  document portal.
                </p>
              </div>
            )}

            {activeScholarship.requires_questions && (
              <div className="dashboard-form-field">
                <label htmlFor="answers">
                  Additional questions / short answers{" "}
                  <span className="required">*</span>
                </label>
                <textarea
                  id="answers"
                  value={answers}
                  onChange={(e) => setAnswers(e.target.value)}
                  rows={4}
                  placeholder="Answer any extra questions here..."
                  required
                />
              </div>
            )}

            {!activeScholarship.requires_essay &&
              !activeScholarship.requires_transcript &&
              !activeScholarship.requires_questions && (
                <p className="dashboard-text">
                  This scholarship does not require an essay, transcript, or
                  extra questions. Click submit to confirm your application.
                </p>
              )}

            <div className="dashboard-form-actions">
              <button
                type="button"
                className="dashboard-button secondary"
                onClick={() => {
                  setActiveScholarship(null);
                  setApplyError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="dashboard-button primary"
                disabled={submittingApp}
              >
                {submittingApp ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </form>
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
