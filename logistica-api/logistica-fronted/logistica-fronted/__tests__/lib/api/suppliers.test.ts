import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/api/suppliers";
import type { Supplier, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockSupplier: Supplier = {
  id: 1,
  name: "Tech Supplies S.A.",
  contact_name: "Ana García",
  email: "ana@techsupplies.com",
  phone: "+57 300 000 0001",
  address: "Calle 123 #45-67, Bogotá",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Supplier> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSupplier],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getSuppliers ──────────────────────────────────────────────────────────────

describe("getSuppliers", () => {
  it("calls GET /suppliers/ with no query string by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getSuppliers();
    expect(capturedUrl).toBe(`${API_BASE}/suppliers/`);
    expect(result).toEqual(mockPaginated);
  });

  it("appends search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getSuppliers({ search: "tech" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("tech");
  });

  it("appends ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getSuppliers({ ordering: "-name" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("-name");
  });

  it("omits page param when page is '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getSuppliers({ page: "1" });
    expect(new URL(capturedUrl).searchParams.has("page")).toBe(false);
  });

  it("includes page param when page is not '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getSuppliers({ page: "3" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("3");
  });

  it("appends multiple params together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getSuppliers({ search: "tech", ordering: "name", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("tech");
    expect(url.searchParams.get("ordering")).toBe("name");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("parses PaginatedResponse correctly", async () => {
    const multi: PaginatedResponse<Supplier> = {
      count: 2,
      next: `${API_BASE}/suppliers/?page=2`,
      previous: null,
      results: [mockSupplier, { ...mockSupplier, id: 2, name: "Otro S.A." }],
    };
    server.use(
      http.get(`${API_BASE}/suppliers/`, () => HttpResponse.json(multi))
    );
    const result = await getSuppliers();
    expect(result.count).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.next).not.toBeNull();
  });

  it("propagates 403 error without swallowing it", async () => {
    server.use(
      http.get(`${API_BASE}/suppliers/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getSuppliers()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getSupplier ───────────────────────────────────────────────────────────────

describe("getSupplier", () => {
  it("calls GET /suppliers/1/ and returns supplier", async () => {
    server.use(
      http.get(`${API_BASE}/suppliers/1/`, () => HttpResponse.json(mockSupplier))
    );
    const result = await getSupplier(1);
    expect(result).toEqual(mockSupplier);
    expect(result.id).toBe(1);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/suppliers/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getSupplier(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createSupplier ────────────────────────────────────────────────────────────

describe("createSupplier", () => {
  const payload = {
    name: "Tech Supplies S.A.",
    contact_name: "Ana García",
    email: "ana@techsupplies.com",
    phone: "+57 300 000 0001",
    address: "Calle 123 #45-67, Bogotá",
  };

  it("calls POST /suppliers/ and returns created supplier", async () => {
    server.use(
      http.post(`${API_BASE}/suppliers/`, () =>
        HttpResponse.json(mockSupplier, { status: 201 })
      )
    );
    const result = await createSupplier(payload);
    expect(result).toEqual(mockSupplier);
  });

  it("sends the payload fields to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/suppliers/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockSupplier, { status: 201 });
      })
    );
    await createSupplier(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/suppliers/`, () =>
        HttpResponse.json({ name: ["This field is required."] }, { status: 400 })
      )
    );
    await expect(createSupplier(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateSupplier ────────────────────────────────────────────────────────────

describe("updateSupplier", () => {
  const payload = {
    name: "Updated Name",
    contact_name: "Ana García",
    email: "ana@techsupplies.com",
    phone: "+57 300 000 0001",
    address: "Calle 123",
  };

  it("calls PUT /suppliers/1/ and returns updated supplier", async () => {
    const updated = { ...mockSupplier, name: "Updated Name" };
    server.use(
      http.put(`${API_BASE}/suppliers/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateSupplier(1, payload);
    expect(result.name).toBe("Updated Name");
  });

  it("sends PUT (not PATCH) to the correct URL", async () => {
    let method = "";
    let capturedUrl = "";
    server.use(
      http.put(`${API_BASE}/suppliers/2/`, ({ request }) => {
        method = request.method;
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockSupplier, id: 2 });
      })
    );
    await updateSupplier(2, payload);
    expect(method).toBe("PUT");
    expect(capturedUrl).toContain("/suppliers/2/");
  });
});

// ── deleteSupplier ────────────────────────────────────────────────────────────

describe("deleteSupplier", () => {
  it("calls DELETE /suppliers/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/suppliers/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteSupplier(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it("propagates 404 when supplier not found", async () => {
    server.use(
      http.delete(`${API_BASE}/suppliers/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(deleteSupplier(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
