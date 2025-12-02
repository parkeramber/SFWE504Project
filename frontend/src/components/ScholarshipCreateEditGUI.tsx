// frontend/src/components/ScholarshipCreateEditGUI.tsx
import {useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createScholarship } from "../scholarships/api";
import { fetchMe } from "../auth/api";
import type { User } from "../auth/types";

export default function ScholarshipCreateEditGUI() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [minGpa, setMinGpa] = useState<number | "">("");
  const [requiredCitizenship, setRequiredCitizenship] = useState("");
  const [requiredMajor, setRequiredMajor] = useState("");
  const [requiredMinor, setRequiredMinor] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On mount, load the current user and make sure they're engr_admin
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const me = await fetchMe();

        if (cancelled) return;

        if (!me) {
          setError("Session expired, please log in again.");
          return;
        }

        setCurrentUser(me);

        if (me.role !== "engr_admin") {
          setError("You do not have permission to manage scholarships.");
        }
      } catch (e) {
        if (!cancelled) {
          setError("Unable to verify your role.");
        }
      } finally {
        if (!cancelled) {
          setCheckingRole(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Still checking who they are? Don't submit yet.
    if (checkingRole) {
      return;
    }

    // Guard: must be logged in and engr_admin
    if (!currentUser || currentUser.role !== "engr_admin") {
      setError("You do not have permission to manage scholarships.");
      return;
    }

    if (!name || !description || !amount || !deadline || !requirements) {
      setError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createScholarship({
        name,
        description,
        amount: Number(amount),
        deadline, // yyyy-mm-dd from <input type="date" />
        requirements,
        min_gpa: minGpa === "" ? null : Number(minGpa),
        required_citizenship: requiredCitizenship || null,
        required_major: requiredMajor || null,
        required_minor: requiredMinor || null,
      });

      setMessage("Scholarship created successfully!");

      // Reset form
      setName("");
      setDescription("");
      setAmount("");
      setDeadline("");
      setRequirements("");
      setMinGpa("");
      setRequiredCitizenship("");
      setRequiredMajor("");
      setRequiredMinor("");
    } catch (err: any) {
      console.error("Failed to create scholarship", err);
      setError("Failed to create scholarship. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // While we're figuring out who they are
  if (checkingRole) {
    return (
      <div className="dashboard">
        <p>Checking your permissions…</p>
      </div>
    );
  }

  // If they aren't allowed, show error + back button
  if (!currentUser || currentUser.role !== "engr_admin") {
    return (
      <div className="dashboard">
        <p className="dashboard-error">
          {error || "You do not have permission to view this page."}
        </p>
        <button
          className="dashboard-button"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Normal form for engr_admin
  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Manage Scholarships</h2>
      <p className="dashboard-subtitle">
        Create a new scholarship opportunity.
      </p>

      {error && <p className="dashboard-error">{error}</p>}
      {message && <p className="dashboard-success">{message}</p>}

      <form className="dashboard-form" onSubmit={handleSubmit}>
        <label className="dashboard-label">
          Scholarship Name
          <input
            className="dashboard-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Women in Engineering Scholarship"
          />
        </label>

        <label className="dashboard-label">
          Description
          <textarea
            className="dashboard-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Supports underrepresented students in Engineering."
          />
        </label>

        <label className="dashboard-label">
          Amount (USD)
          <input
            className="dashboard-input"
            type="number"
            min={0}
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>

        <label className="dashboard-label">
          Deadline
          <input
            className="dashboard-input"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>

        <label className="dashboard-label">
          Requirements
          <textarea
            className="dashboard-textarea"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Minimum 3.0 GPA, Engineering major…"
          />
        </label>

        <label className="dashboard-label">
          Minimum GPA
          <input
            className="dashboard-input"
            type="number"
            step="0.01"
            min={0}
            max={4}
            value={minGpa}
            onChange={(e) =>
              setMinGpa(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="e.g. 3.0"
          />
        </label>

        <label className="dashboard-label">
          Required Citizenship
          <input
            className="dashboard-input"
            type="text"
            value={requiredCitizenship}
            onChange={(e) => setRequiredCitizenship(e.target.value)}
            placeholder="e.g. US Citizen, Permanent Resident"
          />
        </label>

        <label className="dashboard-label">
          Required Major
          <input
            className="dashboard-input"
            type="text"
            value={requiredMajor}
            onChange={(e) => setRequiredMajor(e.target.value)}
            placeholder="e.g. Software Engineering"
          />
        </label>

        <label className="dashboard-label">
          Required Minor (optional)
          <input
            className="dashboard-input"
            type="text"
            value={requiredMinor}
            onChange={(e) => setRequiredMinor(e.target.value)}
            placeholder="e.g. Mathematics"
          />
        </label>

        <div className="dashboard-form-actions">
          <button
            className="dashboard-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Create Scholarship"}
          </button>

          <button
            className="dashboard-button secondary"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
}
