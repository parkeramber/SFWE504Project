const ACCESS_KEY = "eduaid_access_token";
const REFRESH_KEY = "eduaid_refresh_token";

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export function saveTokens(tokens: StoredTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function loadTokens(): StoredTokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
