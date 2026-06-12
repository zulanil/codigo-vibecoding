import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { apiClient } from "@/lib/api/client";
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  getShipmentItems,
  createShipmentItem,
} from "@/lib/api/shipments";
import type { Shipment, ShipmentProduct, PaginatedResponse } from "@/lib/types";

const API_BASE = "http://localhost:8000/api/v1";

const mockItem: ShipmentProduct = {
  id: 20,
  product: 5,
  quantity: 2,
  unit_price: "750.00",
};

const mockShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-2024-0001",
  customer: 3,
  origin_warehouse: 2,
  route: null,
  status: "pending",
  origin_address: "Calle 1 #2-3, Bogotá",
  destination_address: "Av. 5 #10-20, Medellín",
  scheduled_delivery_date: "2024-07-01",
  actual_delivery_date: null,
  weight_kg: "3.500",
  declared_value: "1500.00",
  shipping_cost: "75.00",
  notes: "Frágil",
  shipment_products: [mockItem],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPaginated: PaginatedResponse<Shipment> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockShipment],
};

let originalAdapter: typeof apiClient.defaults.adapter;

beforeAll(() => {
  originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = "fetch";
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

// ── getShipments ──────────────────────────────────────────────────────────────

describe("getShipments", () => {
  it("calls GET /shipments/ with no params by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    const result = await getShipments();
    expect(capturedUrl).toBe(`${API_BASE}/shipments/`);
    expect(result).toEqual(mockPaginated);
  });

  it("forwards search param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ search: "TRK" });
    expect(new URL(capturedUrl).searchParams.get("search")).toBe("TRK");
  });

  it("forwards status filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ status: "in_transit" });
    expect(new URL(capturedUrl).searchParams.get("status")).toBe("in_transit");
  });

  it("forwards customer filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ customer: "3" });
    expect(new URL(capturedUrl).searchParams.get("customer")).toBe("3");
  });

  it("forwards origin_warehouse filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ origin_warehouse: "2" });
    expect(new URL(capturedUrl).searchParams.get("origin_warehouse")).toBe("2");
  });

  it("forwards route filter", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ route: "5" });
    expect(new URL(capturedUrl).searchParams.get("route")).toBe("5");
  });

  it("forwards ordering param", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ ordering: "-scheduled_delivery_date" });
    expect(new URL(capturedUrl).searchParams.get("ordering")).toBe("-scheduled_delivery_date");
  });

  it("forwards page param (does NOT skip page=1 unlike manual-QS modules)", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ page: "1" });
    expect(new URL(capturedUrl).searchParams.get("page")).toBe("1");
  });

  it("forwards all filters together", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${API_BASE}/shipments/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockPaginated);
      })
    );
    await getShipments({ search: "TRK", status: "delivered", customer: "3", page: "2" });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get("search")).toBe("TRK");
    expect(url.searchParams.get("status")).toBe("delivered");
    expect(url.searchParams.get("customer")).toBe("3");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("propagates 403 error", async () => {
    server.use(
      http.get(`${API_BASE}/shipments/`, () => new HttpResponse(null, { status: 403 }))
    );
    await expect(getShipments()).rejects.toMatchObject({ response: { status: 403 } });
  });
});

// ── getShipment ───────────────────────────────────────────────────────────────

describe("getShipment", () => {
  it("calls GET /shipments/1/ and returns shipment with items", async () => {
    server.use(
      http.get(`${API_BASE}/shipments/1/`, () => HttpResponse.json(mockShipment))
    );
    const result = await getShipment(1);
    expect(result).toEqual(mockShipment);
    expect(result.shipment_products).toHaveLength(1);
  });

  it("propagates 404 for unknown id", async () => {
    server.use(
      http.get(`${API_BASE}/shipments/99/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getShipment(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createShipment ────────────────────────────────────────────────────────────

describe("createShipment", () => {
  const payload = {
    customer: 3,
    origin_warehouse: 2,
    route: null,
    status: "pending" as const,
    origin_address: "Calle 1 #2-3, Bogotá",
    destination_address: "Av. 5 #10-20, Medellín",
    scheduled_delivery_date: "2024-07-01",
    actual_delivery_date: null,
    weight_kg: "3.500",
    declared_value: "1500.00",
    shipping_cost: "75.00",
    notes: "Frágil",
  };

  it("calls POST /shipments/ and returns created shipment", async () => {
    server.use(
      http.post(`${API_BASE}/shipments/`, () =>
        HttpResponse.json(mockShipment, { status: 201 })
      )
    );
    const result = await createShipment(payload);
    expect(result).toEqual(mockShipment);
  });

  it("sends the payload to the server", async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/shipments/`, async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json(mockShipment, { status: 201 });
      })
    );
    await createShipment(payload);
    expect(captured).toMatchObject({ customer: 3, status: "pending" });
  });

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${API_BASE}/shipments/`, () =>
        HttpResponse.json({ customer: ["This field is required."] }, { status: 400 })
      )
    );
    await expect(createShipment(payload)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});

// ── updateShipment ────────────────────────────────────────────────────────────

describe("updateShipment", () => {
  const payload = {
    customer: 3,
    origin_warehouse: 2,
    route: 5,
    status: "in_transit" as const,
    origin_address: "Calle 1 #2-3",
    destination_address: "Av. 5 #10-20",
    scheduled_delivery_date: "2024-07-02",
    actual_delivery_date: null,
    weight_kg: "3.500",
    declared_value: "1500.00",
    shipping_cost: "75.00",
    notes: "",
  };

  it("calls PUT /shipments/1/ and returns updated shipment", async () => {
    const updated = { ...mockShipment, status: "in_transit" as const };
    server.use(
      http.put(`${API_BASE}/shipments/1/`, () => HttpResponse.json(updated))
    );
    const result = await updateShipment(1, payload);
    expect(result.status).toBe("in_transit");
  });

  it("sends PUT to the correct URL", async () => {
    let method = "";
    server.use(
      http.put(`${API_BASE}/shipments/6/`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...mockShipment, id: 6 });
      })
    );
    await updateShipment(6, payload);
    expect(method).toBe("PUT");
  });
});

// ── deleteShipment ────────────────────────────────────────────────────────────

describe("deleteShipment", () => {
  it("calls DELETE /shipments/1/ and resolves with undefined", async () => {
    let called = false;
    server.use(
      http.delete(`${API_BASE}/shipments/1/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await deleteShipment(1);
    expect(called).toBe(true);
    expect(result).toBeUndefined();
  });
});

// ── getShipmentItems ──────────────────────────────────────────────────────────

describe("getShipmentItems", () => {
  it("calls GET /shipments/1/items/ and returns items array", async () => {
    server.use(
      http.get(`${API_BASE}/shipments/1/items/`, () => HttpResponse.json([mockItem]))
    );
    const result = await getShipmentItems(1);
    expect(result).toEqual([mockItem]);
    expect(result).toHaveLength(1);
  });

  it("propagates 404 for unknown shipment", async () => {
    server.use(
      http.get(`${API_BASE}/shipments/99/items/`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    await expect(getShipmentItems(99)).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ── createShipmentItem ────────────────────────────────────────────────────────

describe("createShipmentItem", () => {
  const itemPayload = {
    product: 5,
    quantity: 3,
    unit_price: "500.00",
  };

  it("calls POST /shipments/1/items/ and returns created item", async () => {
    const newItem = { ...mockItem, ...itemPayload, id: 21 };
    server.use(
      http.post(`${API_BASE}/shipments/1/items/`, () =>
        HttpResponse.json(newItem, { status: 201 })
      )
    );
    const result = await createShipmentItem(1, itemPayload);
    expect(result).toEqual(newItem);
  });

  it("sends the payload to the correct nested URL", async () => {
    let capturedUrl = "";
    server.use(
      http.post(`${API_BASE}/shipments/7/items/`, async ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ ...mockItem, id: 30 }, { status: 201 });
      })
    );
    await createShipmentItem(7, itemPayload);
    expect(capturedUrl).toContain("/shipments/7/items/");
  });
});
