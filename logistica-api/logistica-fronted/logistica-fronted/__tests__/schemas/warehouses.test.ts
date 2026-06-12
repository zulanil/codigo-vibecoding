import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema defined in components/warehouses/WarehouseForm.tsx
const warehouseSchema = z.object({
  name: z.string().min(1, "Requerido"),
  address: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  country: z.string().min(1, "Requerido"),
  capacity_kg: z
    .string()
    .min(1, "Requerido")
    .refine((v) => parseFloat(v) > 0, "Debe ser mayor a 0"),
});

const validData = {
  name: "Bodega Central",
  address: "Calle 1 #2-3",
  city: "Bogotá",
  country: "Colombia",
  capacity_kg: "5000.00",
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("warehouseSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    expect(warehouseSchema.safeParse(validData).success).toBe(true);
  });

  it("accepts integer string for capacity_kg", () => {
    expect(
      warehouseSchema.safeParse({ ...validData, capacity_kg: "100" }).success
    ).toBe(true);
  });

  it("accepts decimal string for capacity_kg", () => {
    expect(
      warehouseSchema.safeParse({ ...validData, capacity_kg: "0.01" }).success
    ).toBe(true);
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("warehouseSchema — required fields", () => {
  it("fails when name is empty", () => {
    const result = warehouseSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("Requerido");
    }
  });

  it("fails when address is empty", () => {
    const result = warehouseSchema.safeParse({ ...validData, address: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address?.[0]).toBe("Requerido");
    }
  });

  it("fails when city is empty", () => {
    const result = warehouseSchema.safeParse({ ...validData, city: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.city?.[0]).toBe("Requerido");
    }
  });

  it("fails when country is empty", () => {
    const result = warehouseSchema.safeParse({ ...validData, country: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.country?.[0]).toBe("Requerido");
    }
  });

  it("fails when capacity_kg is empty string", () => {
    const result = warehouseSchema.safeParse({ ...validData, capacity_kg: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe("Requerido");
    }
  });

  it("fails when all fields are empty", () => {
    const result = warehouseSchema.safeParse({
      name: "",
      address: "",
      city: "",
      country: "",
      capacity_kg: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toBeTruthy();
      expect(errors.address).toBeTruthy();
      expect(errors.city).toBeTruthy();
      expect(errors.country).toBeTruthy();
      expect(errors.capacity_kg).toBeTruthy();
    }
  });
});

// ── capacity_kg refine validation ─────────────────────────────────────────────

describe("warehouseSchema — capacity_kg numeric constraint", () => {
  it("fails when capacity_kg is '0'", () => {
    const result = warehouseSchema.safeParse({ ...validData, capacity_kg: "0" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe(
        "Debe ser mayor a 0"
      );
    }
  });

  it("fails when capacity_kg is negative", () => {
    const result = warehouseSchema.safeParse({ ...validData, capacity_kg: "-10" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg?.[0]).toBe(
        "Debe ser mayor a 0"
      );
    }
  });

  it("fails when capacity_kg is non-numeric string", () => {
    const result = warehouseSchema.safeParse({ ...validData, capacity_kg: "abc" });
    expect(result.success).toBe(false);
    // parseFloat("abc") → NaN, NaN > 0 is false
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.capacity_kg).toBeTruthy();
    }
  });

  it("passes with capacity_kg = '0.01' (just above zero)", () => {
    expect(
      warehouseSchema.safeParse({ ...validData, capacity_kg: "0.01" }).success
    ).toBe(true);
  });

  it("passes with large capacity value", () => {
    expect(
      warehouseSchema.safeParse({ ...validData, capacity_kg: "999999.99" }).success
    ).toBe(true);
  });
});
