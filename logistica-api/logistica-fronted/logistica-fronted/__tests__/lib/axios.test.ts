import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";

// ── Constants ─────────────────────────────────────────────────────────────────
// apiClient baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const API_BASE = "http://localhost:8000/api/v1";
// vitest.config.ts sets jsdom url to http://localhost:3000, so relative fetch calls resolve here
const NEXT_BASE = "http://localhost:3000";

// ── Adapter ──────────────────────────────────────────────────────────────────
// Force fetch adapter so MSW (which intercepts fetch) can intercept axios requests.
// Default in jsdom is XHR; MSW/node does not intercept XHR.
let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── window.location mock ─────────────────────────────────────────────────────
// Replace window.location with a plain object to capture href assignments.
// Must start with a valid base URL so MSW can resolve relative URLs (e.g.
// fetch("/api/auth/refresh") → new URL(path, location.href) → needs a base).
let locationMock: { href: string };

beforeAll(() => {
  locationMock = { href: "http://localhost:3000" };
  Object.defineProperty(window, "location", {
    value: locationMock,
    writable: true,
    configurable: true,
  });
});

// ── Cookie helpers ────────────────────────────────────────────────────────────
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}

function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

beforeEach(() => {
  clearAllCookies();
  locationMock.href = "http://localhost:3000";
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("apiClient — request interceptor", () => {
  it("adds Authorization header when access token cookie exists", async () => {
    setCookie("access_token", "mytoken");

    let captured: Request | undefined;
    server.use(
      http.get(`${API_BASE}/items`, ({ request }) => {
        captured = request.clone();
        return HttpResponse.json([]);
      })
    );

    await apiClient.get("/items");

    expect(captured?.headers.get("Authorization")).toBe("Bearer mytoken");
  });

  it("does not add Authorization header when no access token", async () => {
    let captured: Request | undefined;
    server.use(
      http.get(`${API_BASE}/items`, ({ request }) => {
        captured = request.clone();
        return HttpResponse.json([]);
      })
    );

    await apiClient.get("/items");

    expect(captured?.headers.get("Authorization")).toBeNull();
  });
});

describe("apiClient — response interceptor (401 handling)", () => {
  it("retries with new token after successful refresh", async () => {
    setCookie("access_token", "oldtoken");

    let requestCount = 0;
    const authHeaders: (string | null)[] = [];

    server.use(
      http.get(`${API_BASE}/items`, ({ request }) => {
        requestCount++;
        authHeaders.push(request.headers.get("Authorization"));
        if (requestCount === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${NEXT_BASE}/api/auth/refresh`, () => {
        // Simulate the Next.js route handler setting a new access_token cookie
        setCookie("access_token", "newtoken");
        return HttpResponse.json({ success: true });
      })
    );

    const res = await apiClient.get("/items");

    expect(res.status).toBe(200);
    expect(requestCount).toBe(2);
    expect(authHeaders[1]).toBe("Bearer newtoken");
  });

  it("calls logout and redirects to /login when refresh fails", async () => {
    setCookie("access_token", "expiredtoken");

    let logoutCalled = false;

    server.use(
      http.get(`${API_BASE}/items`, () => new HttpResponse(null, { status: 401 })),
      // HttpResponse.error() causes fetch to reject with a TypeError (network error)
      http.post(`${NEXT_BASE}/api/auth/refresh`, () => HttpResponse.error()),
      http.post(`${NEXT_BASE}/api/auth/logout`, () => {
        logoutCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    await expect(apiClient.get("/items")).rejects.toThrow();

    expect(logoutCalled).toBe(true);
    expect(locationMock.href).toBe("/login");
  });

  it("calls logout and redirects to /login when no refresh token (refresh rejected)", async () => {
    // No access_token set — any 401 should attempt refresh, which fails → redirect
    server.use(
      http.get(`${API_BASE}/items`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${NEXT_BASE}/api/auth/refresh`, () => HttpResponse.error()),
      http.post(`${NEXT_BASE}/api/auth/logout`, () => HttpResponse.json({ success: true }))
    );

    await expect(apiClient.get("/items")).rejects.toThrow();
    expect(locationMock.href).toBe("/login");
  });

  it("does not retry infinitely (_retry flag stops second attempt)", async () => {
    setCookie("access_token", "sometoken");

    let requestCount = 0;

    server.use(
      // Always return 401 — even after retry
      http.get(`${API_BASE}/items`, () => {
        requestCount++;
        return new HttpResponse(null, { status: 401 });
      }),
      // Refresh succeeds but does not set a new cookie → token unchanged
      http.post(`${NEXT_BASE}/api/auth/refresh`, () =>
        HttpResponse.json({ success: true })
      )
    );

    await expect(apiClient.get("/items")).rejects.toThrow();

    // Initial request (401) + 1 retry (401 + _retry=true → reject), no more
    expect(requestCount).toBe(2);
  });

  it("does not enter interceptor again for non-401 errors", async () => {
    server.use(
      http.get(`${API_BASE}/items`, () => new HttpResponse(null, { status: 403 }))
    );

    await expect(apiClient.get("/items")).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});
