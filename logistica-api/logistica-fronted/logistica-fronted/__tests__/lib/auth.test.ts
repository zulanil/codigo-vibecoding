import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from "@/lib/auth";

describe("lib/auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── getAccessToken ──────────────────────────────────────────────────────────
  describe("getAccessToken", () => {
    it("returns null when nothing is stored", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("returns the stored token", () => {
      localStorage.setItem("logistica_access_token", "abc123");
      expect(getAccessToken()).toBe("abc123");
    });

    it("returns null for empty string value", () => {
      localStorage.setItem("logistica_access_token", "");
      expect(getAccessToken()).toBeNull();
    });

    it("returns null in SSR (window undefined)", () => {
      vi.stubGlobal("window", undefined);
      expect(getAccessToken()).toBeNull();
      vi.unstubAllGlobals();
    });
  });

  // ── getRefreshToken ─────────────────────────────────────────────────────────
  describe("getRefreshToken", () => {
    it("returns null when nothing is stored", () => {
      expect(getRefreshToken()).toBeNull();
    });

    it("returns the stored refresh token", () => {
      localStorage.setItem("logistica_refresh_token", "refresh_xyz");
      expect(getRefreshToken()).toBe("refresh_xyz");
    });

    it("returns null for empty string value", () => {
      localStorage.setItem("logistica_refresh_token", "");
      expect(getRefreshToken()).toBeNull();
    });

    it("returns null in SSR", () => {
      vi.stubGlobal("window", undefined);
      expect(getRefreshToken()).toBeNull();
      vi.unstubAllGlobals();
    });
  });

  // ── setTokens ───────────────────────────────────────────────────────────────
  describe("setTokens", () => {
    it("sets only the access token", () => {
      setTokens({ access: "new_access" });
      expect(localStorage.getItem("logistica_access_token")).toBe("new_access");
      expect(localStorage.getItem("logistica_refresh_token")).toBeNull();
    });

    it("sets only the refresh token", () => {
      setTokens({ refresh: "new_refresh" });
      expect(localStorage.getItem("logistica_refresh_token")).toBe("new_refresh");
      expect(localStorage.getItem("logistica_access_token")).toBeNull();
    });

    it("sets both tokens", () => {
      setTokens({ access: "a", refresh: "r" });
      expect(localStorage.getItem("logistica_access_token")).toBe("a");
      expect(localStorage.getItem("logistica_refresh_token")).toBe("r");
    });

    it("does not overwrite a token that was not passed", () => {
      localStorage.setItem("logistica_access_token", "existing_access");
      setTokens({ refresh: "new_refresh" });
      expect(localStorage.getItem("logistica_access_token")).toBe("existing_access");
    });

    it("is a no-op in SSR", () => {
      vi.stubGlobal("window", undefined);
      expect(() => setTokens({ access: "x" })).not.toThrow();
      vi.unstubAllGlobals();
      expect(localStorage.getItem("logistica_access_token")).toBeNull();
    });
  });

  // ── clearTokens ─────────────────────────────────────────────────────────────
  describe("clearTokens", () => {
    it("removes both tokens", () => {
      localStorage.setItem("logistica_access_token", "a");
      localStorage.setItem("logistica_refresh_token", "r");
      clearTokens();
      expect(localStorage.getItem("logistica_access_token")).toBeNull();
      expect(localStorage.getItem("logistica_refresh_token")).toBeNull();
    });

    it("does not throw when keys are not present", () => {
      expect(() => clearTokens()).not.toThrow();
    });

    it("is a no-op in SSR", () => {
      vi.stubGlobal("window", undefined);
      expect(() => clearTokens()).not.toThrow();
      vi.unstubAllGlobals();
    });
  });

  // ── isAuthenticated ─────────────────────────────────────────────────────────
  describe("isAuthenticated", () => {
    it("returns false when no token is stored", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true with a truthy token", () => {
      localStorage.setItem("logistica_access_token", "token123");
      expect(isAuthenticated()).toBe(true);
    });

    it("returns false when token is empty string", () => {
      localStorage.setItem("logistica_access_token", "");
      expect(isAuthenticated()).toBe(false);
    });

    it("returns false in SSR", () => {
      vi.stubGlobal("window", undefined);
      expect(isAuthenticated()).toBe(false);
      vi.unstubAllGlobals();
    });
  });
});
