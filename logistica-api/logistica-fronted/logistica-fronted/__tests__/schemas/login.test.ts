import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/schemas/login";

describe("loginSchema", () => {
  it("passes with valid username and password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("fails with empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "secret" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.username?.[0];
      expect(msg).toBe("Usuario requerido");
    }
  });

  it("fails with empty password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.password?.[0];
      expect(msg).toBe("Contraseña requerida");
    }
  });

  it("fails when both fields are empty", () => {
    const result = loginSchema.safeParse({ username: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.username?.[0]).toBe("Usuario requerido");
      expect(errors.password?.[0]).toBe("Contraseña requerida");
    }
  });

  it("fails when fields are missing", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
