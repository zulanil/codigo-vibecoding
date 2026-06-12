import { create } from "zustand";
import { logoutRequest } from "@/lib/api/auth";

interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  isSuperuser: boolean;
  groups: string[];
  permissions: string[];
  setAuthenticated: (value: boolean) => void;
  setUsername: (username: string) => void;
  refreshUserFromCookie: () => void;
  logout: () => Promise<void>;
}

interface JwtPayload {
  username?: string;
  sub?: string;
  is_superuser?: boolean;
  groups?: string[];
  permissions?: string[];
}

function hasAccessToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("access_token="));
}

function decodeJwtPayload(): JwtPayload | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("access_token="));
  if (!cookie) return null;
  try {
    const token = cookie.trim().replace("access_token=", "");
    return JSON.parse(atob(token.split(".")[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => {
  const payload = decodeJwtPayload();
  return {
    isAuthenticated: hasAccessToken(),
    username: payload?.username ?? payload?.sub ?? null,
    isSuperuser: payload?.is_superuser ?? false,
    groups: payload?.groups ?? [],
    permissions: payload?.permissions ?? [],
    setAuthenticated: (value) => set({ isAuthenticated: value }),
    setUsername: (username) => set({ username }),
    refreshUserFromCookie: () => {
      const p = decodeJwtPayload();
      set({
        isAuthenticated: hasAccessToken(),
        username: p?.username ?? p?.sub ?? null,
        isSuperuser: p?.is_superuser ?? false,
        groups: p?.groups ?? [],
        permissions: p?.permissions ?? [],
      });
    },
    logout: async () => {
      await logoutRequest();
      set({ isAuthenticated: false, username: null, isSuperuser: false, groups: [], permissions: [] });
      window.location.href = "/login";
    },
  };
});
