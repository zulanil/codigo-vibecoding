import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/lib/api/warehouses";
import type { Warehouse, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Bodega Central",
  address: "Calle 1 #2-3",
  city: "Bogotá",
  country: "Colombia",
  capacity_kg: "5000.00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Warehouse> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockWarehouse],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getWarehouses ─────────────────────────────────────────────────────────────

describe("getWarehouses", () => {
  it("calls GET /warehouses/ with no query string by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getWarehouses();
    expect(capturedUrl).toBe(`${API_BASE}/warehouses/`);
    expect(result).toEqual(mockPaginated);
  });

  it("appends search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ search: "central" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("central");
  });

  it("appends city filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ city: "Bogotá" });
    expect(new URL(capturedUrl).searchParams.get("city")).toBe("Bogotá");
  });

  it("appends country filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ country: "Colombia" });
    expect(new URL(capturedUrl).searchParams.get("country")).toBe("Colombia");
  });

  it("appends ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ ordering: "-city" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("-city");
  });

  it("omits page param when page is '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ page: "1" });
    expect(new URL(capturedUrl).searchParams.has("page")).toBe(false);
  });

  it("includes page param when page is not '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ page: "2" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("2");
  });

  it("appends all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getWarehouses({ search: "bodega", city: "Medellín", country: "Colombia", ordering: "name", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("bodega");
    expect(url.searchParams.get("city")).toBe("Medellín");
    expect(url.searchParams.get("country")).toBe("Colombia");
    expect(url.searchParams.get("ordering")).toBe("name");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/warehouses/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getWarehouses()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getWarehouse ──────────────────────────────────────────────────────────────

describe("getWarehouse", () => {
  it("calls GET /warehouses/1/ and returns warehouse", async () => {
    server.use(
      http.get(`${API_BASE}/warehouses/1/`, () => HttpResponse.json(mockWarehouse))
    );
    const result = await getWarehouse(1);
    expect(result).toEqual(mockWarehouse);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/warehouses/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getWarehouse(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createWarehouse ───────────────────────────────────────────────────────────

describe("createWarehouse", () => {
  const payload = {
    name: "Bodega Norte",
    address: "Av. 5 #10-20",
    city: "Medellín",
    country: "Colombia",
    capacity_kg: "2500.00",
  };

  it("calls POST /warehouses/ and returns created warehouse", async () => {
    server.use(
      http.post(`${API_BASE}/warehouses/`, () =>
        HttpResponse.json(mockWarehouse, { status: 201 })
      )
    );
    const result = await createWarehouse(payload);
    expect(result).toEqual(mockWarehouse);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/warehouses/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockWarehouse, { status: 201 });
      })
    );
    await createWarehouse(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/warehouses/`, () =>
        HttpResponse.json({ name: ["This field is required."] }, { status: 400 })
      )
    );
    await expect(createWarehouse(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateWarehouse ───────────────────────────────────────────────────────────

describe("updateWarehouse", () => {
  const payload = {
    name: "Bodega Sur",
    address: "Calle 5 #1-2",
    city: "Cali",
    country: "Colombia",
    capacity_kg: "3000.00",
  };

  it("calls PUT /warehouses/1/ and returns updated warehouse", async () => {
    const updated = { ...mockWarehouse, name: "Bodega Sur" };
    server.use(
      http.put(`${API_BASE}/warehouses/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateWarehouse(1, payload);
    expect(result.name).toBe("Bodega Sur");
  });

  it("sends PUT (not PATCH) to the correct URL", async () => {
    let method = "";
    let capturedUrl = "";
    server.use(
      http.put(`${API_BASE}/warehouses/3/`, ({ request }) => {
        method = request.method;
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockWarehouse, id: 3 });
      })
    );
    await updateWarehouse(3, payload);
    expect(method).toBe("PUT");
    expect(capturedUrl).toContain("/warehouses/3/");
  });
});

// ── deleteWarehouse ───────────────────────────────────────────────────────────

describe("deleteWarehouse", () => {
  it("calls DELETE /warehouses/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/warehouses/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteWarehouse(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it("propagates 404 when warehouse not found", async () => {
    server.use(
      http.delete(`${API_BASE}/warehouses/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(deleteWarehouse(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
