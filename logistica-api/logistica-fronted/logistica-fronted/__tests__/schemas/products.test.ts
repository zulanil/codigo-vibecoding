import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema in components/products/ProductForm.tsx
const decimalField = z
  .string()
  .min(1, "Requerido")
  .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser > 0");

const productSchema = z.object({
  supplier: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  sku: z.string().min(1, "Requerido"),
  description: z.string(),
  weight_kg: decimalField,
  length_cm: decimalField,
  width_cm: decimalField,
  height_cm: decimalField,
  unit_price: decimalField,
});

const validData = {
  supplier: "2",
  name: "Laptop Pro 15",
  sku: "LAP-PRO-15",
  description: "Laptop de alto rendimiento",
  weight_kg: "2.500",
  length_cm: "35.00",
  width_cm: "24.00",
  height_cm: "2.00",
  unit_price: "1500.00",
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("productSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    expect(productSchema.safeParse(validData).success).toBe(true);
  });

  it("passes with empty description (optional field)", () => {
    expect(
      productSchema.safeParse({ ...validData, description: "" }).success
    ).toBe(true);
  });

  it("passes with integer string for numeric fields", () => {
    expect(
      productSchema.safeParse({
        ...validData,
        weight_kg: "1",
        length_cm: "10",
        width_cm: "5",
        height_cm: "3",
        unit_price: "100",
      }).success
    ).toBe(true);
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("productSchema — required fields", () => {
  const requiredStringFields = ["supplier", "name", "sku"] as const;

  for (const field of requiredStringFields) {
    it(`fails when ${field} is empty`, () => {
      const result = productSchema.safeParse({ ...validData, [field]: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors[field]?.[0]).toBe("Requerido");
      }
    });
  }

  it("fails when all required fields are empty", () => {
    const result = productSchema.safeParse({
      supplier: "",
      name: "",
      sku: "",
      description: "",
      weight_kg: "",
      length_cm: "",
      width_cm: "",
      height_cm: "",
      unit_price: "",
    });
    expect(result.success).toBe(false);
  });
});

// ── decimalField validation ───────────────────────────────────────────────────

describe("productSchema — decimal fields (weight_kg, length_cm, width_cm, height_cm, unit_price)", () => {
  const decimalFields = [
    "weight_kg",
    "length_cm",
    "width_cm",
    "height_cm",
    "unit_price",
  ] as const;

  for (const field of decimalFields) {
    it(`fails when ${field} is empty`, () => {
      const result = productSchema.safeParse({ ...validData, [field]: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors[field]?.[0]).toBe("Requerido");
      }
    });

    it(`fails when ${field} is '0'`, () => {
      const result = productSchema.safeParse({ ...validData, [field]: "0" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors[field]?.[0]).toBe("Debe ser > 0");
      }
    });

    it(`fails when ${field} is negative`, () => {
      const result = productSchema.safeParse({ ...validData, [field]: "-5" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors[field]?.[0]).toBe("Debe ser > 0");
      }
    });

    it(`fails when ${field} is non-numeric string`, () => {
      const result = productSchema.safeParse({ ...validData, [field]: "abc" });
      expect(result.success).toBe(false);
    });

    it(`passes when ${field} is '0.001' (just above zero)`, () => {
      expect(
        productSchema.safeParse({ ...validData, [field]: "0.001" }).success
      ).toBe(true);
    });
  }
});
