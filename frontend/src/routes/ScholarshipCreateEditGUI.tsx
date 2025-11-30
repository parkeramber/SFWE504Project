// frontend/src/routes/ScholarshipCreateEditGUI.tsx
import { useState } from "react";
import "./ScholarshipCreateEditGUI.css";
import { createScholarship } from "../scholarships/api";

type FormState = {
  name: string;
  description: string;
  amount: string;
  deadline: string;
  requirements: string;
};

export default function ScholarshipCreateEditGUI() {
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    amount: "",
    deadline: "",
    requirements: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // very light validation
    if (!form.name.trim()) {
      setError("Please enter a scholarship name.");
      return;
    }
    if (!form.amount || Number.isNaN(Number(form.amount))) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSubmitting(true);

      await createScholarship({
        name: form.name.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        deadline: form.deadline, // from <input type="date">
        requirements: form.requirements.trim(),
      });

      setSuccess("Scholarship created successfully.");
      setForm({
        name: "",
        description: "",
        amount: "",
        deadline: "",
        requirements: "",
      });
    } catch (err: any) {
      console.error("Create scholarship failed", err);
      const detail =
        err?.response?.data?.detail ||
        "Unable to create scholarship. Please try again.";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="scholarship-page">
      <div className="scholarship-card">
        <header className="scholarship-header">
          <h1 className="scholarship-title">Create Scholarship</h1>
          <p className="scholarship-subtitle">
            Fill out the form below to create a new scholarship.
          </p>
        </header>

        {error && <p className="scholarship-alert scholarship-alert--error">{error}</p>}
        {success && (
          <p className="scholarship-alert scholarship-alert--success">{success}</p>
        )}

        <form className="scholarship-form" onSubmit={handleSubmit}>
          <div className="scholarship-form-grid">
            <div className="scholarship-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., SHPE – EduAid Scholarship"
                required
              />
            </div>

            <div className="scholarship-field">
              <label htmlFor="amount">Amount (USD)</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="100"
                value={form.amount}
                onChange={handleChange}
                placeholder="e.g., 2500"
                required
              />
            </div>

            <div className="scholarship-field scholarship-field--full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Short description of the scholarship purpose and who it is for."
              />
            </div>

            <div className="scholarship-field">
              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="scholarship-field scholarship-field--full">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                rows={4}
                value={form.requirements}
                onChange={handleChange}
                placeholder="GPA minimum, major, class standing, essays, financial need, etc."
              />
            </div>
          </div>

          <div className="scholarship-actions">
            <button
              type="submit"
              className="scholarship-submit"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create Scholarship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
