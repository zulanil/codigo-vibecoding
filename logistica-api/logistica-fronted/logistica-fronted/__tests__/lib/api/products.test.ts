import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api/products";
import type { Product, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockProduct: Product = {
  id: 1,
  supplier: 2,
  name: "Laptop Pro 15",
  sku: "LAP-PRO-15",
  description: "Laptop de alto rendimiento",
  weight_kg: "2.500",
  length_cm: "35.00",
  width_cm: "24.00",
  height_cm: "2.00",
  unit_price: "1500.00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Product> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockProduct],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getProducts ───────────────────────────────────────────────────────────────

describe("getProducts", () => {
  it("calls GET /products/ with no query string by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getProducts();
    expect(capturedUrl).toBe(`${API_BASE}/products/`);
    expect(result).toEqual(mockPaginated);
  });

  it("appends search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getProducts({ search: "laptop" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("laptop");
  });

  it("appends supplier filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getProducts({ supplier: "2" });
    expect(new URL(capturedUrl).searchParams.get("supplier")).toBe("2");
  });

  it("appends ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getProducts({ ordering: "unit_price" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("unit_price");
  });

  it("omits page param when page is '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getProducts({ page: "1" });
    expect(new URL(capturedUrl).searchParams.has("page")).toBe(false);
  });

  it("includes page param when page is not '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getProducts({ page: "2" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("2");
  });

  it("appends all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getProducts({ search: "laptop", supplier: "3", ordering: "-sku", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("laptop");
    expect(url.searchParams.get("supplier")).toBe("3");
    expect(url.searchParams.get("ordering")).toBe("-sku");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/products/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getProducts()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getProduct ────────────────────────────────────────────────────────────────

describe("getProduct", () => {
  it("calls GET /products/1/ and returns product", async () => {
    server.use(
      http.get(`${API_BASE}/products/1/`, () => HttpResponse.json(mockProduct))
    );
    const result = await getProduct(1);
    expect(result).toEqual(mockProduct);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/products/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getProduct(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createProduct ─────────────────────────────────────────────────────────────

describe("createProduct", () => {
  const payload = {
    supplier: 2,
    name: "Laptop Pro 15",
    sku: "LAP-PRO-15",
    description: "Laptop de alto rendimiento",
    weight_kg: "2.500",
    length_cm: "35.00",
    width_cm: "24.00",
    height_cm: "2.00",
    unit_price: "1500.00",
  };

  it("calls POST /products/ and returns created product", async () => {
    server.use(
      http.post(`${API_BASE}/products/`, () =>
        HttpResponse.json(mockProduct, { status: 201 })
      )
    );
    const result = await createProduct(payload);
    expect(result).toEqual(mockProduct);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/products/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockProduct, { status: 201 });
      })
    );
    await createProduct(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/products/`, () =>
        HttpResponse.json({ sku: ["Product with this SKU already exists."] }, { status: 400 })
      )
    );
    await expect(createProduct(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateProduct ─────────────────────────────────────────────────────────────

describe("updateProduct", () => {
  const payload = {
    supplier: 2,
    name: "Laptop Pro 16",
    sku: "LAP-PRO-16",
    description: "Updated",
    weight_kg: "2.600",
    length_cm: "36.00",
    width_cm: "25.00",
    height_cm: "2.10",
    unit_price: "1600.00",
  };

  it("calls PUT /products/1/ and returns updated product", async () => {
    const updated = { ...mockProduct, name: "Laptop Pro 16" };
    server.use(
      http.put(`${API_BASE}/products/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateProduct(1, payload);
    expect(result.name).toBe("Laptop Pro 16");
  });

  it("sends PUT to the correct URL", async () => {
    let method = "";
    server.use(
      http.put(`${API_BASE}/products/5/`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...mockProduct, id: 5 });
      })
    );
    await updateProduct(5, payload);
    expect(method).toBe("PUT");
  });
});

// ── deleteProduct ─────────────────────────────────────────────────────────────

describe("deleteProduct", () => {
  it("calls DELETE /products/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/products/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteProduct(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it("propagates 404 when product not found", async () => {
    server.use(
      http.delete(`${API_BASE}/products/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(deleteProduct(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
