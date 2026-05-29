import { create } from "zustand";
import { logoutRequest } from "@/lib/api/auth";

interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  setAuthenticated: (value: boolean) => void;
  setUsername: (username: string) => void;
  logout: () => Promise<void>;
}

function hasAccessToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("access_token="));
}

function decodeUsernameFromJwt(): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("access_token="));
  if (!cookie) return null;
  try {
    const token = cookie.trim().replace("access_token=", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: hasAccessToken(),
  username: decodeUsernameFromJwt(),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUsername: (username) => set({ username }),
  logout: async () => {
    await logoutRequest();
    set({ isAuthenticated: false, username: null });
    window.location.href = "/login";
  },
}));
