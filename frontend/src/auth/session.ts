// frontend/src/auth/session.ts
import type { Tokens } from "./types";

const STORAGE_KEY = "authTokens";

// Save access + refresh tokens
export function saveTokens(tokens: Tokens) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.error("Failed to save tokens", err);
  }
}

// Load tokens from localStorage
export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Tokens;
  } catch (err) {
    console.error("Failed to load tokens", err);
    return null;
  }
}

// Remove tokens from storage
export function clearTokens() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear tokens", err);
  }
}

// Helper: get just the access token
export function getAccessToken(): string | null {
  const tokens = loadTokens();
  return tokens?.accessToken ?? null;
}

// Logout = clear tokens + send user back to /auth
export function logout() {
  clearTokens();
  // Hard redirect is fine for this project
  window.location.href = "/login";
}
