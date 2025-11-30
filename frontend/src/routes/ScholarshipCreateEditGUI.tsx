// FRONTEND: src/routes/ScholarshipCreateEditGUI.tsx

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe } from "../auth/api";
import { loadTokens, clearTokens } from "../auth/session";
import type { User } from "../auth/types";
import { createScholarship } from "../scholarships/api";

type FormState = {
  name: string;
  description: string;
  amount: string;      // keep as string in the form, convert to number on submit
  deadline: string;    // "YYYY-MM-DD"
  requirements: string;
};

export default function ScholarshipCreateEditGUI() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    amount: "",
    deadline: "",
    requirements: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const tokens = loadTokens();
        if (!tokens) {
          setError("No active session. Please log in.");
          return;
        }

        // fetchMe will internally handle expired tokens and logout (we coded that earlier)
        const me = await fetchMe();
        if (!me || cancelled) return;

        setUser(me);
      } catch (err) {
        console.error("Failed to load current user", err);
        if (!cancelled) {
          setError("Session expired, please log in again.");
          clearTokens();
          navigate("/auth", { replace: true });
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("No user loaded.");
      return;
    }

    if (user.role !== "engr_admin") {
      setError("You do not have permission to create scholarships.");
      return;
    }

    const amountNumber = Number(form.amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    try {
      setSaving(true);

      await createScholarship({
        name: form.name.trim(),
        description: form.description.trim() || null,
        amount: amountNumber,
        deadline: form.deadline,          // e.g. "2026-01-31"
        requirements: form.requirements.trim() || null,
      });

      // After successful creation, go back to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Failed to create scholarship", err);
      setError(
        err?.response?.data?.detail ??
          "Failed to create scholarship. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading states
  if (!user && !error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p>Loading user…</p>
        </div>
      </div>
    );
  }

  // If we have a user but they’re not an admin
  if (user && user.role !== "engr_admin") {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Access Denied</h2>
          <p>You do not have permission to manage scholarships.</p>
        </div>
      </div>
    );
  }

  // Happy path: admin + form
  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2>Create Scholarship</h2>
        <p className="lead-text">
          Fill out the form below to create a new scholarship.
        </p>

        {error && <p className="dashboard-error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <label className="form-field">
            <span>Amount (USD)</span>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              min={1}
            />
          </label>

          <label className="form-field">
            <span>Deadline</span>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Requirements</span>
            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <button className="dashboard-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create Scholarship"}
          </button>
        </form>
      </div>
    </div>
  );
}
