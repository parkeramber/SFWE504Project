import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe, loginUser, refreshSession, registerUser } from "./api";
import { clearTokens, loadTokens, saveTokens } from "./session";
import type { Tokens, User, UserRole } from "./types";
import Notification from "../components/Notification";
import "../App.css";

type Mode = "login" | "register";

type Props = {
  defaultMode?: Mode;
};

export default function AuthPage({ defaultMode = "login" }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("applicant");
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-clear alerts after 3 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (message || error) {
      timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [message, error]);

  const passwordError = (pwd: string): string | null => {
    if (!pwd || pwd.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (pwd.length > 20) {
      return "Password must be at most 20 characters.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must include at least one uppercase letter.";
    }
    if (!/\d/.test(pwd)) {
      return "Password must include at least one number.";
    }
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      return "Password must include at least one symbol.";
    }
    return null;
  };

  const extractError = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail;
    if (!detail) return fallback;
    if (Array.isArray(detail)) {
      // FastAPI validation errors come as a list; pick the first message.
      const first = detail[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof detail === "string") return detail;
    return fallback;
  };

  useEffect(() => {
    const stored = loadTokens();
    if (stored) {
      setTokens(stored);
      hydrateUser(stored);
    }
  }, []);

  const hydrateUser = async (tokenPair: Tokens) => {
    try {
      const me = await fetchMe(tokenPair.accessToken);
      setUser(me);
    } catch {
      try {
        const refreshed = await refreshSession(tokenPair.refreshToken);
        setTokens(refreshed);
        saveTokens(refreshed);
        const me = await fetchMe(refreshed.accessToken);
        setUser(me);
      } catch {
        clearAuth();
      }
    }
  };

  const clearAuth = () => {
    clearTokens();
    setTokens(null);
    setUser(null);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const newTokens = await loginUser({ email, password });
      setTokens(newTokens);
      saveTokens(newTokens);
      await hydrateUser(newTokens);
      setMessage("Logged in");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(extractError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const pwError = passwordError(password);
    if (pwError) {
      setLoading(false);
      setError(pwError);
      return;
    }
    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }
    try {
      await registerUser({
        email,
        password,
        firstName,
        lastName,
        role,
      });
      setMode("login");
      setMessage("Registration successful. Please log in.");
    } catch (err: any) {
      setError(extractError(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setMessage("Logged out");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1> </h1>
          <div className="mode-toggle">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                navigate("/login", { replace: true });
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                navigate("/register", { replace: true });
              }}
              type="button"
            >
              Register
            </button>
          </div>
        </div>

        {user ? (
          <div className="welcome">
            <p className="eyebrow">Signed in as</p>
            <h2>
              {user.first_name || user.last_name
                ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                : user.email}
            </h2>
            <p className="role">Role: {user.role}</p>
            <div className="token-actions">
              <button onClick={handleLogout}>Log out</button>
              <button
                onClick={() => tokens && hydrateUser(tokens)}
                disabled={!tokens}
              >
                Refresh session
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div className="form-row">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </>
            )}
            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <p className="helper-text">8-20 chars, with uppercase, number, and symbol.</p>
            </div>
            {mode === "register" && (
              <div className="form-row">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat password"
                />
              </div>
            )}
            {mode === "register" && (
              <div className="form-row">
                <label htmlFor="role">Role</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                  <option value="applicant">Applicant</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="sponsor_donor">Sponsor / Donor</option>
                  <option value="steward">Steward</option>
                  <option value="engr_admin">ENGR Admin</option>
                </select>
              </div>
            )}
            <button type="submit" disabled={loading}>
              {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        )}

        {(message || error) && (
          <Notification
            kind={error ? "error" : "success"}
            message={error || message || ""}
            onClose={() => {
              setMessage(null);
              setError(null);
            }}
            autoHideMs={3000}
          />
        )}

        {!user && tokens?.refreshToken && (
          <div className="alert info">
            <p>Have a session? Try refresh.</p>
            <button onClick={() => tokens && hydrateUser(tokens)}>Refresh</button>
          </div>
        )}
      </div>
    </div>
  );
}
