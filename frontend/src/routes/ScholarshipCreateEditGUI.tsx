// frontend/src/routes/ScholarshipCreateEditGUI.tsx
import { useEffect, useState } from "react";

import { fetchMe } from "../auth/api";
import type { User } from "../auth/types";
import {
  listScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  type Scholarship,
  type ScholarshipInput,
} from "../scholarships/api";

type FormState = {
  name: string;
  description: string;
  amount: string; // keep as string for <input>, convert before send
  deadline: string; // "YYYY-MM-DD"
  requirements: string;
  requires_essay: boolean;
  requires_transcript: boolean;
  requires_questions: boolean;
  min_gpa: string;
  required_citizenship: string;
  required_major: string;
  required_minor: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  amount: "",
  deadline: "",
  requirements: "",
  requires_essay: false,
  requires_transcript: false,
  requires_questions: false,
  min_gpa: "",
  required_citizenship: "",
  required_major: "",
  required_minor: "",
};

export default function ScholarshipCreateEditGUI() {
  const [user, setUser] = useState<User | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user + scholarships
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const me = await fetchMe();
        if (cancelled) return;

        setUser(me);

        const data = await listScholarships();
        if (!cancelled) {
          setScholarships(data);
        }
      } catch (err: any) {
        console.error("Error loading scholarship admin screen", err);
        if (!cancelled) {
          setError(
            err?.response?.data?.detail ?? "Failed to load scholarships.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle field changes (supports text inputs, textarea, and checkboxes)
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name } = target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Start editing an existing scholarship
  function startEdit(s: Scholarship) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description,
      amount: String(s.amount),
      // backend sends full ISO date, e.g. "2025-02-28T00:00:00"
      deadline: s.deadline.slice(0, 10),
      requirements: s.requirements,
      requires_essay: !!s.requires_essay,
      requires_transcript: !!s.requires_transcript,
      requires_questions: !!s.requires_questions,
      min_gpa: s.min_gpa ? String(s.min_gpa) : "",
      required_citizenship: s.required_citizenship || "",
      required_major: s.required_major || "",
      required_minor: s.required_minor || "",
    });
    setSuccess(null);
    setError(null);
  }

  // Reset after create/update
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: ScholarshipInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      amount: Number(form.amount),
      deadline: form.deadline,
      requirements: form.requirements.trim(),
      requires_essay: form.requires_essay,
      requires_transcript: form.requires_transcript,
      requires_questions: form.requires_questions,
      min_gpa: form.min_gpa === "" ? null : Number(form.min_gpa),
      required_citizenship: form.required_citizenship || null,
      required_major: form.required_major || null,
      required_minor: form.required_minor || null,
    };

    if (!payload.name || !payload.amount || !payload.deadline) {
      setSaving(false);
      setError("Name, amount, and deadline are required.");
      return;
    }

    try {
      if (editingId === null) {
        // Create new
        const created = await createScholarship(payload);
        setScholarships((prev) => [...prev, created]);
        setSuccess("Scholarship created successfully.");
      } else {
        // Update existing
        const updated = await updateScholarship(editingId, payload);
        setScholarships((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s)),
        );
        setSuccess("Scholarship updated successfully.");
      }
      resetForm();
    } catch (err: any) {
      console.error("Error saving scholarship", err);
      setError(err?.response?.data?.detail ?? "Failed to save scholarship.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this scholarship?",
    );
    if (!confirmed) return;

    try {
      await deleteScholarship(id);
      setScholarships((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      console.error("Error deleting scholarship", err);
      setError(err?.response?.data?.detail ?? "Failed to delete scholarship.");
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p>Loading scholarship management…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p>Session expired. Please log in again.</p>
        </div>
      </div>
    );
  }

  if (user.role !== "engr_admin") {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Access denied</h2>
          <p>You must be an ENGR Admin to manage scholarships.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h2>Create / Edit Scholarships</h2>
        <p className="lead-text">
          Use this form to create new scholarships or edit existing ones.
        </p>

        {error && <p className="dashboard-error">{error}</p>}
        {success && <p className="dashboard-success">{success}</p>}

        <form className="scholarship-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Name
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Amount (USD)
              <input
                name="amount"
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Deadline
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-full">
              Description
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-full">
              Requirements
              <textarea
                name="requirements"
                rows={3}
                value={form.requirements}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Minimum GPA
              <input
                type="number"
                step="0.01"
                min={0}
                max={4}
                name="min_gpa"
                value={form.min_gpa}
                onChange={handleChange}
                placeholder="e.g. 3.0"
              />
            </label>
            <label>
              Required Citizenship
              <input
                type="text"
                name="required_citizenship"
                value={form.required_citizenship}
                onChange={handleChange}
                placeholder="e.g. US Citizen, Permanent Resident"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Required Major
              <input
                type="text"
                name="required_major"
                value={form.required_major}
                onChange={handleChange}
                placeholder="e.g. Software Engineering"
              />
            </label>
            <label>
              Required Minor (optional)
              <input
                type="text"
                name="required_minor"
                value={form.required_minor}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
              />
            </label>
          </div>

          {/* NEW: Application requirement toggles */}
          <div className="form-row">
            <fieldset className="form-full">
              <legend>Application requirements</legend>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="requires_essay"
                  checked={form.requires_essay}
                  onChange={handleChange}
                />
                Essay required
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="requires_transcript"
                  checked={form.requires_transcript}
                  onChange={handleChange}
                />
                Transcript required
              </label>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  name="requires_questions"
                  checked={form.requires_questions}
                  onChange={handleChange}
                />
                Extra questions required
              </label>
            </fieldset>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="dashboard-button"
              disabled={saving}
            >
              {editingId === null
                ? saving
                  ? "Creating…"
                  : "Create Scholarship"
                : saving
                  ? "Updating…"
                  : "Update Scholarship"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="dashboard-button secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="dashboard-card">
        <h3>Existing Scholarships</h3>
        {scholarships.length === 0 ? (
          <p>No scholarships created yet.</p>
        ) : (
          <table className="scholarship-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>${s.amount}</td>
                  <td>{s.deadline.slice(0, 10)}</td>
                  <td className="scholarship-actions">
                    <button
                      type="button"
                      className="small-button"
                      onClick={() => startEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="small-button danger"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
