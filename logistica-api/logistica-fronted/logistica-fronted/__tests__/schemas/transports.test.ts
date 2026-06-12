import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema in components/transports/TransportForm.tsx
const transportSchema = z.object({
  driver: z.string(),
  plate_number: z.string().min(1, "Requerido"),
  vehicle_type: z.enum(["truck", "van", "motorcycle"]),
  capacity_kg: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser > 0"),
  status: z.enum(["available", "in_use", "maintenance"]),
});

const validData = {
  driver: "3",
  plate_number: "ABC-123",
  vehicle_type: "truck" as const,
  capacity_kg: "8000.00",
  status: "available" as const,
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("transportSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    expect(transportSchema.safeParse(validData).success).toBe(true);
  });

  it("passes with empty driver string (driver is optional)", () => {
    expect(
      transportSchema.safeParse({ ...validData, driver: "" }).success
    ).toBe(true);
  });

  it("passes for all vehicle_type values", () => {
    const types = ["truck", "van", "motorcycle"] as const;
    for (const vehicle_type of types) {
      expect(
        transportSchema.safeParse({ ...validData, vehicle_type }).success
      ).toBe(true);
    }
  });

  it("passes for all status values", () => {
    const statuses = ["available", "in_use", "maintenance"] as const;
    for (const status of statuses) {
      expect(
        transportSchema.safeParse({ ...validData, status }).success
      ).toBe(true);
    }
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("transportSchema — required fields", () => {
  it("fails when plate_number is empty", () => {
    const result = transportSchema.safeParse({ ...validData, plate_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.plate_number?.[0]).toBe("Requerido");
    }
  });

  it("fails when capacity_kg is empty", () => {
    const result = transportSchema.safeParse({ ...validData, capacity_kg: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe("Requerido");
    }
  });

  it("fails when vehicle_type is missing", () => {
    const { vehicle_type: _omit, ...noType } = validData;
    expect(transportSchema.safeParse(noType).success).toBe(false);
  });

  it("fails when status is missing", () => {
    const { status: _omit, ...noStatus } = validData;
    expect(transportSchema.safeParse(noStatus).success).toBe(false);
  });
});

// ── capacity_kg refine validation ─────────────────────────────────────────────

describe("transportSchema — capacity_kg numeric constraint", () => {
  it("fails when capacity_kg is '0'", () => {
    const result = transportSchema.safeParse({ ...validData, capacity_kg: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe("Debe ser > 0");
    }
  });

  it("fails when capacity_kg is negative", () => {
    const result = transportSchema.safeParse({ ...validData, capacity_kg: "-100" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe("Debe ser > 0");
    }
  });

  it("fails when capacity_kg is non-numeric", () => {
    expect(
      transportSchema.safeParse({ ...validData, capacity_kg: "abc" }).success
    ).toBe(false);
  });

  it("passes with capacity_kg = '0.01'", () => {
    expect(
      transportSchema.safeParse({ ...validData, capacity_kg: "0.01" }).success
    ).toBe(true);
  });
});

// ── vehicle_type enum ─────────────────────────────────────────────────────────

describe("transportSchema — vehicle_type enum", () => {
  it("fails with unknown vehicle_type", () => {
    const result = transportSchema.safeParse({ ...validData, vehicle_type: "bus" });
    expect(result.success).toBe(false);
  });
});

// ── status enum ───────────────────────────────────────────────────────────────

describe("transportSchema — status enum", () => {
  it("fails with unknown status", () => {
    const result = transportSchema.safeParse({ ...validData, status: "broken" });
    expect(result.success).toBe(false);
  });
});
