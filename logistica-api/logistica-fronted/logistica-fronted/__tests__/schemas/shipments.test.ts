import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema in components/shipments/ShipmentForm.tsx
const shipmentSchema = z.object({
  customer: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  route: z.string(),
  status: z.enum(["pending", "assigned", "in_transit", "delivered", "cancelled"]),
  origin_address: z.string().min(1, "Requerido"),
  destination_address: z.string().min(1, "Requerido"),
  scheduled_delivery_date: z.string().min(1, "Requerido"),
  weight_kg: z.string().min(1, "Requerido"),
  declared_value: z.string().min(1, "Requerido"),
  shipping_cost: z.string().min(1, "Requerido"),
  notes: z.string(),
});

const validData = {
  customer: "3",
  origin_warehouse: "2",
  route: "",
  status: "pending" as const,
  origin_address: "Calle 1 #2-3, Bogotá",
  destination_address: "Av. 5 #10-20, Medellín",
  scheduled_delivery_date: "2024-07-01",
  weight_kg: "3.500",
  declared_value: "1500.00",
  shipping_cost: "75.00",
  notes: "",
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("shipmentSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    expect(shipmentSchema.safeParse(validData).success).toBe(true);
  });

  it("passes with empty route string (optional)", () => {
    expect(shipmentSchema.safeParse({ ...validData, route: "" }).success).toBe(true);
  });

  it("passes with non-empty route string", () => {
    expect(shipmentSchema.safeParse({ ...validData, route: "5" }).success).toBe(true);
  });

  it("passes with empty notes (optional)", () => {
    expect(shipmentSchema.safeParse({ ...validData, notes: "" }).success).toBe(true);
  });

  it("passes for all status values", () => {
    const statuses = ["pending", "assigned", "in_transit", "delivered", "cancelled"] as const;
    for (const status of statuses) {
      expect(shipmentSchema.safeParse({ ...validData, status }).success).toBe(true);
    }
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("shipmentSchema — required fields", () => {
  const requiredFields = [
    "customer",
    "origin_warehouse",
    "origin_address",
    "destination_address",
    "scheduled_delivery_date",
    "weight_kg",
    "declared_value",
    "shipping_cost",
  ] as const;

  for (const field of requiredFields) {
    it(`fails when ${field} is empty`, () => {
      const result = shipmentSchema.safeParse({ ...validData, [field]: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors[field]?.[0]).toBe("Requerido");
      }
    });
  }

  it("fails when status is missing", () => {
    const { status: _omit, ...noStatus } = validData;
    expect(shipmentSchema.safeParse(noStatus).success).toBe(false);
  });
});

// ── status enum ───────────────────────────────────────────────────────────────

describe("shipmentSchema — status enum", () => {
  it("fails with unknown status value", () => {
    const result = shipmentSchema.safeParse({ ...validData, status: "processing" });
    expect(result.success).toBe(false);
  });

  it("fails with empty string status", () => {
    expect(shipmentSchema.safeParse({ ...validData, status: "" }).success).toBe(false);
  });

  it("accepts all 5 valid status values", () => {
    const valid = ["pending", "assigned", "in_transit", "delivered", "cancelled"] as const;
    for (const s of valid) {
      expect(shipmentSchema.safeParse({ ...validData, status: s }).success).toBe(true);
    }
  });
});
