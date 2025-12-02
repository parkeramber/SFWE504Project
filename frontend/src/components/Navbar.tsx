import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { fetchMe } from "../auth/api";
import { loadTokens, clearTokens } from "../auth/session";
import type { User, Tokens } from "../auth/types";
import {
  listNotificationsForUser,
  markNotificationRead,
  type Notification,
} from "../applications/api";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [hasSession, setHasSession] = useState(false);

  // optional: you don't actually *need* these since displayName uses `user`,
  // but keeping them is fine if you want them for later
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // ---- helper to get "First Last" or fallback to email ----
  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(" ");
    }
    return user.email;
  }, [user]);

  // ---- hydrate user from token pair ----
  const hydrate = async (tokenPair: Tokens) => {
    try {
      const me = await fetchMe(tokenPair.accessToken);

      // TS-safe: handle null/undefined
      if (!me) {
        setUser(null);
        setHasSession(false);
        return;
      }

      setUser(me);
      setHasSession(true);

      // these are optional, so use ?? "" to satisfy TS
      setFirstName(me.first_name ?? "");
      setLastName(me.last_name ?? "");
    } catch {
      // If token invalid, clear session
      clearTokens();
      setTokens(null);
      setUser(null);
      setHasSession(false);
    }
  };

  // ---- on route change, reload tokens + possibly user ----
  useEffect(() => {
    const stored = loadTokens();
    if (!stored) {
      setTokens(null);
      setUser(null);
      setHasSession(false);
      return;
    }
    setTokens(stored);
    setHasSession(true);
    void hydrate(stored);
  }, [location.pathname]);

  // ---- listen for profile updates from elsewhere in the app ----
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<User | null>;
      if (custom.detail) {
        setUser(custom.detail);
        setHasSession(true);
      }
    };

    window.addEventListener(
      "eduaid:user-updated",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "eduaid:user-updated",
        handler as EventListener
      );
  }, []);

  const handleLogout = () => {
    clearTokens();
    setTokens(null);
    setUser(null);
    setHasSession(false);
    navigate("/login", { replace: true });
  };

  // Load reviewer notifications count
  useEffect(() => {
    const loadNotifs = async () => {
      if (!user || user.role !== "reviewer") {
        setNotificationCount(0);
        return;
      }
      try {
        const data = await listNotificationsForUser(user.id);
        setNotifications(data);
        setNotificationCount(data.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("Failed to load notifications", err);
        setNotifications([]);
        setNotificationCount(0);
      }
    };
    void loadNotifs();
  }, [user]);

  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <div className="brand">
          <Link
            to={hasSession ? "/dashboard" : "/login"}
            className="brand-link"
          >
            EduAid
          </Link>
        </div>

        {(user || hasSession) && (
          <div className="nav-actions right">
            <div className="welcome-stack">
              <span className="eyebrow">Welcome</span>
              <span className="welcome-name">
                {displayName || "..."}
              </span>
            </div>
            {user?.role === "reviewer" && (
              <div className="notif-wrapper">
                <button
                  type="button"
                  className="notif-button"
                  onClick={() => {
                    setShowNotifPanel((s) => !s);
                    // Mark unread as read when opening
                    if (!showNotifPanel) {
                      void (async () => {
                        const unread = notifications.filter((n) => !n.is_read);
                        if (unread.length) {
                          try {
                            await Promise.all(
                              unread.map((n) => markNotificationRead(n.id)),
                            );
                            setNotifications((prev) =>
                              prev.map((n) => ({ ...n, is_read: true })),
                            );
                            setNotificationCount(0);
                          } catch (err) {
                            console.error("Failed to mark notifications read", err);
                          }
                        } else {
                          setNotificationCount(0);
                        }
                      })();
                    } else {
                      setNotificationCount(0);
                    }
                  }}
                  title="Reviewer notifications"
                >
                  <span aria-hidden="true">🔔</span>
                  {notificationCount > 0 && (
                    <span className="notif-badge">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>
                {showNotifPanel && (
                  <div className="notif-panel">
                    <div className="notif-panel-header">
                      <strong>Notifications</strong>
                      <button
                        type="button"
                        className="notif-close"
                        onClick={() => setShowNotifPanel(false)}
                      >
                        ×
                      </button>
                    </div>
                    {notifications.length === 0 && (
                      <p className="notif-empty">No notifications.</p>
                    )}
                    {notifications.length > 0 && (
                      <>
                        <div className="notif-section">Unread</div>
                        <ul className="notif-list">
                          {notifications
                            .filter((n) => !n.is_read)
                            .map((n) => (
                              <li key={n.id} className="notif-item">
                                <div className="notif-msg">{n.message}</div>
                                <div className="notif-meta">
                                  {new Date(n.created_at).toLocaleString()}
                                </div>
                              </li>
                            ))}
                        </ul>
                        <div className="notif-section">Read</div>
                        <ul className="notif-list">
                          {notifications
                            .filter((n) => n.is_read)
                            .map((n) => (
                              <li key={n.id} className="notif-item notif-item--read">
                                <div className="notif-msg">{n.message}</div>
                                <div className="notif-meta">
                                  {new Date(n.created_at).toLocaleString()}
                                </div>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            <Link
              to="/myprofile"
              className="profile-trigger"
              aria-label="My Profile"
              title="My Profile"
            >
              <span aria-hidden="true">👤</span>
            </Link>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
