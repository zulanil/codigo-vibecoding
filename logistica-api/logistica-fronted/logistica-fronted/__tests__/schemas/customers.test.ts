import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema defined in components/customers/CustomerForm.tsx
const customerSchema = z.object({
  name: z.string().min(1, "Requerido"),
  company_name: z.string(),
  customer_type: z.enum(["individual", "company"]),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Requerido"),
  address: z.string().min(1, "Requerido"),
});

const validBase = {
  name: "Carlos López",
  company_name: "TechCorp",
  customer_type: "company" as const,
  email: "carlos@techcorp.com",
  phone: "+57 300 111 2222",
  address: "Av. El Dorado #68-00",
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("customerSchema — valid inputs", () => {
  it("passes with customer_type = 'company'", () => {
    expect(customerSchema.safeParse(validBase).success).toBe(true);
  });

  it("passes with customer_type = 'individual'", () => {
    expect(
      customerSchema.safeParse({ ...validBase, customer_type: "individual" }).success
    ).toBe(true);
  });

  it("passes with empty company_name (field is optional)", () => {
    expect(
      customerSchema.safeParse({ ...validBase, company_name: "" }).success
    ).toBe(true);
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("customerSchema — required fields", () => {
  it("fails when name is empty", () => {
    const result = customerSchema.safeParse({ ...validBase, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("Requerido");
    }
  });

  it("fails when email is empty", () => {
    const result = customerSchema.safeParse({ ...validBase, email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeTruthy();
    }
  });

  it("fails when phone is empty", () => {
    const result = customerSchema.safeParse({ ...validBase, phone: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe("Requerido");
    }
  });

  it("fails when address is empty", () => {
    const result = customerSchema.safeParse({ ...validBase, address: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address?.[0]).toBe("Requerido");
    }
  });

  it("fails when customer_type is missing", () => {
    const { customer_type: _omit, ...noType } = validBase;
    const result = customerSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });
});

// ── customer_type enum ────────────────────────────────────────────────────────

describe("customerSchema — customer_type enum", () => {
  it("fails with an unknown type value", () => {
    const result = customerSchema.safeParse({ ...validBase, customer_type: "business" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.customer_type).toBeTruthy();
    }
  });

  it("fails with empty string for customer_type", () => {
    const result = customerSchema.safeParse({ ...validBase, customer_type: "" });
    expect(result.success).toBe(false);
  });

  it("only accepts 'individual' and 'company'", () => {
    const validTypes = ["individual", "company"] as const;
    for (const type of validTypes) {
      expect(
        customerSchema.safeParse({ ...validBase, customer_type: type }).success
      ).toBe(true);
    }
  });
});

// ── Email validation ──────────────────────────────────────────────────────────

describe("customerSchema — email field", () => {
  it("fails with invalid email format", () => {
    const result = customerSchema.safeParse({ ...validBase, email: "notanemail" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido");
    }
  });

  it("passes with valid email", () => {
    expect(
      customerSchema.safeParse({ ...validBase, email: "user@example.org" }).success
    ).toBe(true);
  });
});
