import { useEffect, useState } from "react";

import { fetchMe, refreshSession } from "../auth/api";
import { loadTokens, saveTokens, clearTokens } from "../auth/session";
import type { User } from "../auth/types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const content = (
    <div className="dashboard-card">
      <h2>Dashboard</h2>
      {error && <p>{error}</p>}
      {!error && user ? (
        <>
          <p className="lead-text">
            Welcome,{" "}
            {user.first_name || user.last_name
              ? [user.first_name, user.last_name].filter(Boolean).join(" ")
              : user.email}
          </p>
          <p>Role: {user.role}</p>
          <p>This is a placeholder protected view.</p>
        </>
      ) : null}
      {!error && !user && <p>Loading user...</p>}
    </div>
  );

  return <div className="dashboard-page">{content}</div>;
}
