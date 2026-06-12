import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} from "@/lib/api/drivers";
import type { Driver, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockDriver: Driver = {
  id: 1,
  user: 5,
  license_number: "B2-12345678",
  phone: "+57 300 555 1234",
  status: "available",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Driver> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockDriver],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getDrivers ────────────────────────────────────────────────────────────────

describe("getDrivers", () => {
  it("calls GET /drivers/ with no query string by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getDrivers();
    expect(capturedUrl).toBe(`${API_BASE}/drivers/`);
    expect(result).toEqual(mockPaginated);
  });

  it("appends search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getDrivers({ search: "B2" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("B2");
  });

  it("appends status filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getDrivers({ status: "available" });
    expect(new URL(capturedUrl).searchParams.get("status")).toBe("available");
  });

  it("appends ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getDrivers({ ordering: "license_number" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("license_number");
  });

  it("omits page param when page is '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getDrivers({ page: "1" });
    expect(new URL(capturedUrl).searchParams.has("page")).toBe(false);
  });

  it("includes page param when page is not '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getDrivers({ page: "3" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("3");
  });

  it("appends all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/drivers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getDrivers({ search: "B2", status: "on_route", ordering: "-status", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("B2");
    expect(url.searchParams.get("status")).toBe("on_route");
    expect(url.searchParams.get("ordering")).toBe("-status");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/drivers/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getDrivers()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getDriver ─────────────────────────────────────────────────────────────────

describe("getDriver", () => {
  it("calls GET /drivers/1/ and returns driver", async () => {
    server.use(
      http.get(`${API_BASE}/drivers/1/`, () => HttpResponse.json(mockDriver))
    );
    const result = await getDriver(1);
    expect(result).toEqual(mockDriver);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/drivers/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getDriver(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createDriver ──────────────────────────────────────────────────────────────

describe("createDriver", () => {
  const payload = {
    user: 5,
    license_number: "B2-12345678",
    phone: "+57 300 555 1234",
    status: "available" as const,
  };

  it("calls POST /drivers/ and returns created driver", async () => {
    server.use(
      http.post(`${API_BASE}/drivers/`, () =>
        HttpResponse.json(mockDriver, { status: 201 })
      )
    );
    const result = await createDriver(payload);
    expect(result).toEqual(mockDriver);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/drivers/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockDriver, { status: 201 });
      })
    );
    await createDriver(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/drivers/`, () =>
        HttpResponse.json({ license_number: ["This field is required."] }, { status: 400 })
      )
    );
    await expect(createDriver(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateDriver ──────────────────────────────────────────────────────────────

describe("updateDriver", () => {
  const payload = {
    user: 5,
    license_number: "C1-99999999",
    phone: "+57 300 999 0000",
    status: "on_route" as const,
  };

  it("calls PUT /drivers/1/ and returns updated driver", async () => {
    const updated = { ...mockDriver, status: "on_route" as const };
    server.use(
      http.put(`${API_BASE}/drivers/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateDriver(1, payload);
    expect(result.status).toBe("on_route");
  });

  it("sends PUT to the correct URL", async () => {
    let method = "";
    server.use(
      http.put(`${API_BASE}/drivers/7/`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...mockDriver, id: 7 });
      })
    );
    await updateDriver(7, payload);
    expect(method).toBe("PUT");
  });
});

// ── deleteDriver ──────────────────────────────────────────────────────────────

describe("deleteDriver", () => {
  it("calls DELETE /drivers/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/drivers/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteDriver(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it("propagates 404 when driver not found", async () => {
    server.use(
      http.delete(`${API_BASE}/drivers/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(deleteDriver(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
