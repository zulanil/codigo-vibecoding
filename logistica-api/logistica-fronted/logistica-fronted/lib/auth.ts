const ACCESS_KEY = "logistica_access_token";
const REFRESH_KEY = "logistica_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY) || null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY) || null;
}

export type TokenPair = { access?: string; refresh?: string };

export function setTokens(tokens: TokenPair): void {
  if (typeof window === "undefined") return;
  if (tokens.access !== undefined) localStorage.setItem(ACCESS_KEY, tokens.access);
  if (tokens.refresh !== undefined) localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
