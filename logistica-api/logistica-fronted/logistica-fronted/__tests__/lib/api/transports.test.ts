import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getTransports,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
} from "@/lib/api/transports";
import type { Transport, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockTransport: Transport = {
  id: 1,
  driver: 3,
  plate_number: "ABC-123",
  vehicle_type: "truck",
  capacity_kg: "8000.00",
  status: "available",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Transport> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockTransport],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getTransports ─────────────────────────────────────────────────────────────

describe("getTransports", () => {
  it("calls GET /transports/ with no query string by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getTransports();
    expect(capturedUrl).toBe(`${API_BASE}/transports/`);
    expect(result).toEqual(mockPaginated);
  });

  it("appends search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ search: "ABC" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("ABC");
  });

  it("appends status filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ status: "available" });
    expect(new URL(capturedUrl).searchParams.get("status")).toBe("available");
  });

  it("appends vehicle_type filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ vehicle_type: "truck" });
    expect(new URL(capturedUrl).searchParams.get("vehicle_type")).toBe("truck");
  });

  it("appends driver filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ driver: "3" });
    expect(new URL(capturedUrl).searchParams.get("driver")).toBe("3");
  });

  it("omits page param when page is '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ page: "1" });
    expect(new URL(capturedUrl).searchParams.has("page")).toBe(false);
  });

  it("includes page param when page is not '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ page: "2" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("2");
  });

  it("appends all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/transports/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getTransports({ search: "ABC", status: "in_use", vehicle_type: "van", driver: "5", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("ABC");
    expect(url.searchParams.get("status")).toBe("in_use");
    expect(url.searchParams.get("vehicle_type")).toBe("van");
    expect(url.searchParams.get("driver")).toBe("5");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/transports/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getTransports()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getTransport ──────────────────────────────────────────────────────────────

describe("getTransport", () => {
  it("calls GET /transports/1/ and returns transport", async () => {
    server.use(
      http.get(`${API_BASE}/transports/1/`, () => HttpResponse.json(mockTransport))
    );
    const result = await getTransport(1);
    expect(result).toEqual(mockTransport);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/transports/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getTransport(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createTransport ───────────────────────────────────────────────────────────

describe("createTransport", () => {
  const payload = {
    driver: null,
    plate_number: "XYZ-789",
    vehicle_type: "van" as const,
    capacity_kg: "3500.00",
    status: "available" as const,
  };

  it("calls POST /transports/ and returns created transport", async () => {
    server.use(
      http.post(`${API_BASE}/transports/`, () =>
        HttpResponse.json(mockTransport, { status: 201 })
      )
    );
    const result = await createTransport(payload);
    expect(result).toEqual(mockTransport);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/transports/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockTransport, { status: 201 });
      })
    );
    await createTransport(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/transports/`, () =>
        HttpResponse.json({ plate_number: ["This field is required."] }, { status: 400 })
      )
    );
    await expect(createTransport(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateTransport ───────────────────────────────────────────────────────────

describe("updateTransport", () => {
  const payload = {
    driver: 3,
    plate_number: "ABC-123",
    vehicle_type: "truck" as const,
    capacity_kg: "9000.00",
    status: "in_use" as const,
  };

  it("calls PUT /transports/1/ and returns updated transport", async () => {
    const updated = { ...mockTransport, status: "in_use" as const };
    server.use(
      http.put(`${API_BASE}/transports/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateTransport(1, payload);
    expect(result.status).toBe("in_use");
  });

  it("sends PUT to the correct URL", async () => {
    let method = "";
    server.use(
      http.put(`${API_BASE}/transports/4/`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...mockTransport, id: 4 });
      })
    );
    await updateTransport(4, payload);
    expect(method).toBe("PUT");
  });
});

// ── deleteTransport ───────────────────────────────────────────────────────────

describe("deleteTransport", () => {
  it("calls DELETE /transports/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/transports/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteTransport(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it("propagates 404 when transport not found", async () => {
    server.use(
      http.delete(`${API_BASE}/transports/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(deleteTransport(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
