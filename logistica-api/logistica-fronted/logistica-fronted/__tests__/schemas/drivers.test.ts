import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema in components/drivers/DriverForm.tsx
const driverSchema = z.object({
  user: z.coerce.number().int().positive("Requerido"),
  license_number: z.string().min(1, "Requerido"),
  phone: z.string().min(1, "Requerido"),
  status: z.enum(["available", "on_route", "off_duty"]),
});

const validData = {
  user: 5,
  license_number: "B2-12345678",
  phone: "+57 300 555 1234",
  status: "available" as const,
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("driverSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    expect(driverSchema.safeParse(validData).success).toBe(true);
  });

  it("coerces user string to number when parseable", () => {
    const result = driverSchema.safeParse({ ...validData, user: "10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.user).toBe(10);
  });

  it("passes for all valid status values", () => {
    const statuses = ["available", "on_route", "off_duty"] as const;
    for (const status of statuses) {
      expect(driverSchema.safeParse({ ...validData, status }).success).toBe(true);
    }
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("driverSchema — required fields", () => {
  it("fails when license_number is empty", () => {
    const result = driverSchema.safeParse({ ...validData, license_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.license_number?.[0]).toBe("Requerido");
    }
  });

  it("fails when phone is empty", () => {
    const result = driverSchema.safeParse({ ...validData, phone: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone?.[0]).toBe("Requerido");
    }
  });

  it("fails when status is missing", () => {
    const { status: _omit, ...noStatus } = validData;
    expect(driverSchema.safeParse(noStatus).success).toBe(false);
  });
});

// ── user field (coerce + positive integer) ────────────────────────────────────

describe("driverSchema — user field", () => {
  it("fails when user is 0", () => {
    const result = driverSchema.safeParse({ ...validData, user: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.user?.[0]).toBe("Requerido");
    }
  });

  it("fails when user is negative", () => {
    const result = driverSchema.safeParse({ ...validData, user: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.user?.[0]).toBe("Requerido");
    }
  });

  it("fails when user is a float", () => {
    const result = driverSchema.safeParse({ ...validData, user: 5.5 });
    expect(result.success).toBe(false);
  });

  it("fails when user is NaN (non-coercible string)", () => {
    const result = driverSchema.safeParse({ ...validData, user: "notanumber" });
    expect(result.success).toBe(false);
  });

  it("passes with user = 1 (minimum positive integer)", () => {
    expect(driverSchema.safeParse({ ...validData, user: 1 }).success).toBe(true);
  });
});

// ── status enum ───────────────────────────────────────────────────────────────

describe("driverSchema — status enum", () => {
  it("fails with unknown status value", () => {
    const result = driverSchema.safeParse({ ...validData, status: "inactive" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toBeTruthy();
    }
  });

  it("fails with empty string status", () => {
    const result = driverSchema.safeParse({ ...validData, status: "" });
    expect(result.success).toBe(false);
  });
});
