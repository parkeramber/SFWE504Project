import { useEffect, useState } from "react";

import { fetchMe } from "../auth/api";
import { loadTokens } from "../auth/session";
import type { User } from "../auth/types";
import {
  listUsers,
  updateUserAdmin,
  deleteUserAdmin,
  type AdminUser,
} from "../admin/api";

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<number, AdminUser>>({});

  useEffect(() => {
    let cancelled = false;
    const tokens = loadTokens();
    if (!tokens) {
      setError("Missing session.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const me = await fetchMe(tokens.accessToken);
        if (cancelled) return;
        setUser(me);
        const data = await listUsers(tokens.accessToken);
        if (cancelled) return;
        setUsers(data);
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load users.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleField = (id: number, field: keyof AdminUser, value: string | boolean) => {
    setEditing((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || users.find((u) => u.id === id) || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async (id: number) => {
    const tokens = loadTokens();
    if (!tokens) {
      setError("Missing session.");
      return;
    }
    const draft = editing[id];
    if (!draft) return;

    try {
      const updated = await updateUserAdmin(tokens.accessToken, id, {
        first_name: draft.first_name ?? "",
        last_name: draft.last_name ?? "",
        role: draft.role,
        is_active: draft.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError("Failed to save user.");
    }
  };

  const handleApprove = async (id: number) => {
    const tokens = loadTokens();
    if (!tokens) {
      setError("Missing session.");
      return;
    }
    const target = users.find((u) => u.id === id);
    if (!target) return;
    try {
      const updated = await updateUserAdmin(tokens.accessToken, id, {
        is_active: true,
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError("Failed to approve user.");
    }
  };

  const handleDelete = async (id: number) => {
    const tokens = loadTokens();
    if (!tokens) {
      setError("Missing session.");
      return;
    }
    const target = users.find((u) => u.id === id);
    const name = target
      ? `${target.first_name || ""} ${target.last_name || ""}`.trim() || target.email
      : `User #${id}`;
    const confirmed = window.confirm(`Delete ${name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteUserAdmin(tokens.accessToken, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading users…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-error">Not authorized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="admin-users-header">
          <h2>User Management</h2>
          <p className="dashboard-text admin-users-subtext">
            Approve reviewers, edit details, or delete accounts. Click edit to modify fields.
          </p>
        </div>
        {error && <p className="dashboard-error">{error}</p>}

        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <ul className="admin-users-list">
            {users.map((u) => {
              const draft = editing[u.id] || u;
              const needsApproval =
                (u.role === "reviewer" || u.role === "engr_admin") && !u.is_active;
              const isEditing = Boolean(editing[u.id]);
              const isSelf = user && user.id === u.id;
              return (
                <li key={u.id} className="admin-user-card">
                  <div className="admin-user-header">
                    <div>
                      <strong>User #{u.id}</strong>
                      <span className="admin-user-email">({u.email})</span>
                    </div>
                    {needsApproval && <span className="admin-user-badge">Needs approval</span>}
                  </div>

                  <div className="admin-user-grid">
                    <label className="admin-user-field">
                      First name
                      <input
                        type="text"
                        value={draft.first_name ?? ""}
                        onChange={(e) => handleField(u.id, "first_name", e.target.value)}
                        disabled={!isEditing}
                      />
                    </label>
                    <label className="admin-user-field">
                      Last name
                      <input
                        type="text"
                        value={draft.last_name ?? ""}
                        onChange={(e) => handleField(u.id, "last_name", e.target.value)}
                        disabled={!isEditing}
                      />
                    </label>
                    <label className="admin-user-field">
                      Role
                      <select
                        value={draft.role}
                        onChange={(e) => handleField(u.id, "role", e.target.value)}
                        disabled={!isEditing || isSelf}
                      >
                        <option value="applicant">Applicant</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="sponsor_donor">Sponsor/Donor</option>
                        <option value="steward">Steward</option>
                        <option value="engr_admin">ENGR Admin</option>
                      </select>
                    </label>
                    <label className="admin-user-field inline">
                      <span>Active</span>
                      <input
                        type="checkbox"
                        checked={!!draft.is_active}
                        onChange={(e) => handleField(u.id, "is_active", e.target.checked)}
                        disabled={!isEditing}
                      />
                    </label>
                  </div>

                  <div className="admin-user-actions">
                    {needsApproval && (
                      <button
                        type="button"
                        className="dashboard-button small approve"
                        onClick={() => handleApprove(u.id)}
                      >
                        Approve reviewer
                      </button>
                    )}
                    {!needsApproval && (u.role === "reviewer" || u.role === "engr_admin") && (
                      <button
                        type="button"
                        className="dashboard-button small dashboard-button--danger"
                        onClick={() =>
                          handleField(u.id, "is_active", false) || handleSave(u.id)
                        }
                      >
                        Revoke access
                      </button>
                    )}
                    {!isEditing ? (
                      <button
                        type="button"
                        className="dashboard-button small edit"
                        onClick={() =>
                          setEditing((prev) => ({ ...prev, [u.id]: { ...u } }))
                        }
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dashboard-button small"
                        onClick={() => handleSave(u.id)}
                      >
                        Save
                      </button>
                    )}
                    <button
                      type="button"
                      className="dashboard-button small dashboard-button--danger"
                      onClick={() => handleDelete(u.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
