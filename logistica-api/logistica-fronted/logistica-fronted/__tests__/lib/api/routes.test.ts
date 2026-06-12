import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
  createRouteStop,
} from "@/lib/api/routes";
import type { Route, RouteStop, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockStop: RouteStop = {
  id: 10,
  stop_order: 1,
  address: "Calle 1 #2-3",
  city: "Bogotá",
  estimated_arrival: "2024-06-01T10:00:00Z",
  actual_arrival: null,
};

const mockRoute: Route = {
  id: 1,
  transport: 2,
  origin_warehouse: 3,
  name: "Ruta Bogotá Norte",
  status: "planned",
  scheduled_date: "2024-06-01",
  stops: [mockStop],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Route> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockRoute],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getRoutes ─────────────────────────────────────────────────────────────────

describe("getRoutes", () => {
  it("calls GET /routes/ with no params by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getRoutes();
    // axios passes params object — no query string when empty object
    expect(capturedUrl).toBe(`${API_BASE}/routes/`);
    expect(result).toEqual(mockPaginated);
  });

  it("forwards search param via axios params object", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ search: "Bogotá" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("Bogotá");
  });

  it("forwards status filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ status: "planned" });
    expect(new URL(capturedUrl).searchParams.get("status")).toBe("planned");
  });

  it("forwards transport filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ transport: "2" });
    expect(new URL(capturedUrl).searchParams.get("transport")).toBe("2");
  });

  it("forwards origin_warehouse filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ origin_warehouse: "3" });
    expect(new URL(capturedUrl).searchParams.get("origin_warehouse")).toBe("3");
  });

  it("forwards ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ ordering: "-scheduled_date" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("-scheduled_date");
  });

  it("forwards page param (does NOT skip page=1 unlike other modules)", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ page: "1" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("1");
  });

  it("forwards all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/routes/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getRoutes({ search: "Bogotá", status: "in_progress", transport: "2", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("Bogotá");
    expect(url.searchParams.get("status")).toBe("in_progress");
    expect(url.searchParams.get("transport")).toBe("2");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/routes/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getRoutes()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getRoute ──────────────────────────────────────────────────────────────────

describe("getRoute", () => {
  it("calls GET /routes/1/ and returns route with stops", async () => {
    server.use(
      http.get(`${API_BASE}/routes/1/`, () => HttpResponse.json(mockRoute))
    );
    const result = await getRoute(1);
    expect(result).toEqual(mockRoute);
    expect(result.stops).toHaveLength(1);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/routes/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getRoute(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createRoute ───────────────────────────────────────────────────────────────

describe("createRoute", () => {
  const payload = {
    transport: 2,
    origin_warehouse: 3,
    name: "Ruta Bogotá Norte",
    status: "planned" as const,
    scheduled_date: "2024-06-01",
  };

  it("calls POST /routes/ and returns created route", async () => {
    server.use(
      http.post(`${API_BASE}/routes/`, () =>
        HttpResponse.json(mockRoute, { status: 201 })
      )
    );
    const result = await createRoute(payload);
    expect(result).toEqual(mockRoute);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/routes/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockRoute, { status: 201 });
      })
    );
    await createRoute(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/routes/`, () =>
        HttpResponse.json({ name: ["This field is required."] }, { status: 400 })
      )
    );
    await expect(createRoute(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateRoute ───────────────────────────────────────────────────────────────

describe("updateRoute", () => {
  const payload = {
    transport: 2,
    origin_warehouse: 3,
    name: "Ruta Bogotá Sur",
    status: "in_progress" as const,
    scheduled_date: "2024-06-02",
  };

  it("calls PUT /routes/1/ and returns updated route", async () => {
    const updated = { ...mockRoute, name: "Ruta Bogotá Sur" };
    server.use(
      http.put(`${API_BASE}/routes/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateRoute(1, payload);
    expect(result.name).toBe("Ruta Bogotá Sur");
  });

  it("sends PUT to the correct URL", async () => {
    let method = "";
    server.use(
      http.put(`${API_BASE}/routes/8/`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...mockRoute, id: 8 });
      })
    );
    await updateRoute(8, payload);
    expect(method).toBe("PUT");
  });
});

// ── deleteRoute ───────────────────────────────────────────────────────────────

describe("deleteRoute", () => {
  it("calls DELETE /routes/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/routes/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteRoute(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });
});

// ── getRouteStops ─────────────────────────────────────────────────────────────

describe("getRouteStops", () => {
  it("calls GET /routes/1/stops/ and returns stops array", async () => {
    server.use(
      http.get(`${API_BASE}/routes/1/stops/`, () => HttpResponse.json([mockStop]))
    );
    const result = await getRouteStops(1);
    expect(result).toEqual([mockStop]);
    expect(result).toHaveLength(1);
  });

  it("propagates 404 for unknown route", async () => {
    server.use(
      http.get(`${API_BASE}/routes/99/stops/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getRouteStops(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createRouteStop ───────────────────────────────────────────────────────────

describe("createRouteStop", () => {
  const stopPayload = {
    stop_order: 2,
    address: "Calle 5 #10-20",
    city: "Medellín",
    estimated_arrival: "2024-06-01T14:00:00Z",
    actual_arrival: null,
  };

  it("calls POST /routes/1/stops/ and returns created stop", async () => {
    const newStop = { ...mockStop, ...stopPayload, id: 11 };
    server.use(
      http.post(`${API_BASE}/routes/1/stops/`, () =>
        HttpResponse.json(newStop, { status: 201 })
      )
    );
    const result = await createRouteStop(1, stopPayload);
    expect(result).toEqual(newStop);
  });

  it("sends the payload to the correct nested URL", async () => {
    let capturedUrl = "";
    server.use(
      http.post(`${API_BASE}/routes/5/stops/`, async ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockStop, id: 20 }, { status: 201 });
      })
    );
    await createRouteStop(5, stopPayload);
    expect(capturedUrl).toContain("/routes/5/stops/");
  });
});
