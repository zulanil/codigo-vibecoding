import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of the schema in components/routes/RouteForm.tsx
const routeSchema = z.object({
  transport: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  scheduled_date: z.string().min(1, "Requerido"),
});

const validData = {
  transport: "2",
  origin_warehouse: "3",
  name: "Ruta Bogotá Norte",
  status: "planned" as const,
  scheduled_date: "2024-06-01",
};

// ── Valid cases ───────────────────────────────────────────────────────────────

describe("routeSchema — valid inputs", () => {
  it("passes with all fields correct", () => {
    expect(routeSchema.safeParse(validData).success).toBe(true);
  });

  it("passes for all status values", () => {
    const statuses = ["planned", "in_progress", "completed", "cancelled"] as const;
    for (const status of statuses) {
      expect(routeSchema.safeParse({ ...validData, status }).success).toBe(true);
    }
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("routeSchema — required fields", () => {
  it("fails when transport is empty", () => {
    const result = routeSchema.safeParse({ ...validData, transport: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.transport?.[0]).toBe("Requerido");
    }
  });

  it("fails when origin_warehouse is empty", () => {
    const result = routeSchema.safeParse({ ...validData, origin_warehouse: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.origin_warehouse?.[0]).toBe("Requerido");
    }
  });

  it("fails when name is empty", () => {
    const result = routeSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("Requerido");
    }
  });

  it("fails when scheduled_date is empty", () => {
    const result = routeSchema.safeParse({ ...validData, scheduled_date: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.scheduled_date?.[0]).toBe("Requerido");
    }
  });

  it("fails when all required fields are empty", () => {
    const result = routeSchema.safeParse({
      transport: "",
      origin_warehouse: "",
      name: "",
      status: "planned" as const,
      scheduled_date: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.transport).toBeTruthy();
      expect(errors.origin_warehouse).toBeTruthy();
      expect(errors.name).toBeTruthy();
      expect(errors.scheduled_date).toBeTruthy();
    }
  });
});

// ── status enum ───────────────────────────────────────────────────────────────

describe("routeSchema — status enum", () => {
  it("fails with unknown status", () => {
    const result = routeSchema.safeParse({ ...validData, status: "pending" });
    expect(result.success).toBe(false);
  });

  it("fails with empty string status", () => {
    const result = routeSchema.safeParse({ ...validData, status: "" });
    expect(result.success).toBe(false);
  });

  it("accepts all 4 valid status values", () => {
    const valid = ["planned", "in_progress", "completed", "cancelled"] as const;
    for (const s of valid) {
      expect(routeSchema.safeParse({ ...validData, status: s }).success).toBe(true);
    }
  });
});
