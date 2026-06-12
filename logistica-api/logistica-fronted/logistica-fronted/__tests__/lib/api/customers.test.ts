import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/api/customers";
import type { Customer, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockCustomer: Customer = {
  id: 1,
  user: null,
  name: "Carlos López",
  company_name: "TechCorp S.A.",
  customer_type: "company",
  email: "carlos@techcorp.com",
  phone: "+57 300 111 2222",
  address: "Av. El Dorado #68-00, Bogotá",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCustomer],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getCustomers ──────────────────────────────────────────────────────────────

describe("getCustomers", () => {
  it("calls GET /customers/ with no query string by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getCustomers();
    expect(capturedUrl).toBe(`${API_BASE}/customers/`);
    expect(result).toEqual(mockPaginated);
  });

  it("appends search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getCustomers({ search: "carlos" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("carlos");
  });

  it("appends customer_type filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getCustomers({ customer_type: "company" });
    expect(new URL(capturedUrl).searchParams.get("customer_type")).toBe("company");
  });

  it("appends ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getCustomers({ ordering: "-name" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("-name");
  });

  it("omits page param when page is '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getCustomers({ page: "1" });
    expect(new URL(capturedUrl).searchParams.has("page")).toBe(false);
  });

  it("includes page param when page is not '1'", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getCustomers({ page: "2" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("2");
  });

  it("appends all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getCustomers({ search: "tech", customer_type: "company", ordering: "name", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("tech");
    expect(url.searchParams.get("customer_type")).toBe("company");
    expect(url.searchParams.get("ordering")).toBe("name");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/customers/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getCustomers()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getCustomer ───────────────────────────────────────────────────────────────

describe("getCustomer", () => {
  it("calls GET /customers/1/ and returns customer", async () => {
    server.use(
      http.get(`${API_BASE}/customers/1/`, () => HttpResponse.json(mockCustomer))
    );
    const result = await getCustomer(1);
    expect(result).toEqual(mockCustomer);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/customers/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getCustomer(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createCustomer ────────────────────────────────────────────────────────────

describe("createCustomer", () => {
  const payload = {
    user: null,
    name: "Carlos López",
    company_name: "TechCorp S.A.",
    customer_type: "company" as const,
    email: "carlos@techcorp.com",
    phone: "+57 300 111 2222",
    address: "Av. El Dorado #68-00, Bogotá",
  };

  it("calls POST /customers/ and returns created customer", async () => {
    server.use(
      http.post(`${API_BASE}/customers/`, () =>
        HttpResponse.json(mockCustomer, { status: 201 })
      )
    );
    const result = await createCustomer(payload);
    expect(result).toEqual(mockCustomer);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/customers/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockCustomer, { status: 201 });
      })
    );
    await createCustomer(payload);
    expect(captured).toMatchObject(payload);
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/customers/`, () =>
        HttpResponse.json({ email: ["Enter a valid email address."] }, { status: 400 })
      )
    );
    await expect(createCustomer(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateCustomer ────────────────────────────────────────────────────────────

describe("updateCustomer", () => {
  const payload = {
    user: null,
    name: "Carlos López Updated",
    company_name: "TechCorp",
    customer_type: "individual" as const,
    email: "carlos@techcorp.com",
    phone: "+57 300 111 2222",
    address: "Calle 1",
  };

  it("calls PUT /customers/1/ and returns updated customer", async () => {
    const updated = { ...mockCustomer, name: "Carlos López Updated" };
    server.use(
      http.put(`${API_BASE}/customers/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateCustomer(1, payload);
    expect(result.name).toBe("Carlos López Updated");
  });

  it("sends PUT to the correct URL", async () => {
    let method = "";
    server.use(
      http.put(`${API_BASE}/customers/2/`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...mockCustomer, id: 2 });
      })
    );
    await updateCustomer(2, payload);
    expect(method).toBe("PUT");
  });
});

// ── deleteCustomer ────────────────────────────────────────────────────────────

describe("deleteCustomer", () => {
  it("calls DELETE /customers/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/customers/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteCustomer(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });

  it("propagates 404 when customer not found", async () => {
    server.use(
      http.delete(`${API_BASE}/customers/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(deleteCustomer(99)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
