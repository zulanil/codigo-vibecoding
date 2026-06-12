import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema defined in components/suppliers/SupplierForm.tsx
const supplierSchema = z.object({
  name: z.string().min(1, "Requerido"),
  contact_name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Requerido"),
  address: z.string().min(1, "Requerido"),
});

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("supplierSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    const result = supplierSchema.safeParse({
      name: "Tech Supplies S.A.",
      contact_name: "Ana García",
      email: "ana@techsupplies.com",
      phone: "+57 300 000 0001",
      address: "Calle 123 #45-67, Bogotá",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal single-character strings for non-email fields", () => {
    const result = supplierSchema.safeParse({
      name: "A",
      contact_name: "B",
      email: "a@b.co",
      phone: "1",
      address: "X",
    });
    expect(result.success).toBe(true);
  });
});

// ── Required field validation ─────────────────────────────────────────────────

describe("supplierSchema — required fields", () => {
  const base = {
    name: "Tech Supplies",
    contact_name: "Ana",
    email: "ana@tech.com",
    phone: "+57 300",
    address: "Calle 1",
  };

  it("fails when name is empty", () => {
    const result = supplierSchema.safeParse({ ...base, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("Requerido");
    }
  });

  it("fails when contact_name is empty", () => {
    const result = supplierSchema.safeParse({ ...base, contact_name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.contact_name?.[0]).toBe("Requerido");
    }
  });

  it("fails when phone is empty", () => {
    const result = supplierSchema.safeParse({ ...base, phone: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe("Requerido");
    }
  });

  it("fails when address is empty", () => {
    const result = supplierSchema.safeParse({ ...base, address: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address?.[0]).toBe("Requerido");
    }
  });

  it("fails when all fields are empty", () => {
    const result = supplierSchema.safeParse({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toBeTruthy();
      expect(errors.contact_name).toBeTruthy();
      expect(errors.phone).toBeTruthy();
      expect(errors.address).toBeTruthy();
    }
  });

  it("fails when a field is missing entirely", () => {
    const { address: _omit, ...noAddress } = base;
    const result = supplierSchema.safeParse(noAddress);
    expect(result.success).toBe(false);
  });
});

// ── Email validation ──────────────────────────────────────────────────────────

describe("supplierSchema — email field", () => {
  const base = {
    name: "Tech",
    contact_name: "Ana",
    phone: "+57 300",
    address: "Calle 1",
  };

  it("fails with plain string (no @)", () => {
    const result = supplierSchema.safeParse({ ...base, email: "notanemail" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido");
    }
  });

  it("fails with missing domain part", () => {
    const result = supplierSchema.safeParse({ ...base, email: "user@" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido");
    }
  });

  it("fails with empty string", () => {
    const result = supplierSchema.safeParse({ ...base, email: "" });
    expect(result.success).toBe(false);
  });

  it("passes with valid email formats", () => {
    const emails = [
      "user@example.com",
      "user+tag@sub.domain.org",
      "123@numbers.io",
    ];
    for (const email of emails) {
      const result = supplierSchema.safeParse({ ...base, email });
      expect(result.success).toBe(true);
    }
  });
});
