import { test, expect } from "./fixtures";

function unique(label: string): string {
  return `E2E-${label}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

async function seedUser(api: { seed: (e: string, p: Record<string, unknown>) => Promise<number> }, label: string) {
  const username = unique(`user-${label}`).toLowerCase();
  const userId = await api.seed("auth/users", {
    username,
    password: "TestPass123!",
    email: `${username.replace(/-/g, "")}@example.com`,
    first_name: "E2E",
    last_name: label,
  });
  return userId;
}

test.describe("Drivers CRUD", () => {
  test("la lista renderiza un conductor sembrado vía API", async ({ page, api }) => {
    const userId = await seedUser(api, "Lista");
    const license = unique("LIC-Lista");
    const driverId = await api.seed("drivers", {
      user: userId,
      license_number: license,
      phone: "+57 300 1111111",
      status: "available",
    });

    try {
      await page.goto("/drivers");
      await page.getByLabel("Buscar conductores").fill(license);

      const row = page.getByRole("row").filter({ hasText: license });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByText("Disponible")).toBeVisible();
      await expect(row.getByRole("cell", { name: "+57 300 1111111" })).toBeVisible();
    } finally {
      await api.remove("drivers", driverId);
      await api.remove("auth/users", userId);
    }
  });

  test("crear un conductor desde el formulario, asociado a un usuario", async ({ page, api }) => {
    const userId = await seedUser(api, "Crear");
    const license = unique("LIC-Crear");
    let driverId: number | undefined;

    try {
      await page.goto("/drivers/new");

      await page.getByLabel("ID de usuario").fill(String(userId));
      await page.getByLabel("Número de licencia").fill(license);
      await page.getByLabel("Teléfono").fill("+57 300 2222222");
      await page.getByRole("button", { name: "En ruta" }).click();

      await page.getByRole("button", { name: "Crear conductor" }).click();
      await page.waitForURL(/\/drivers\/?(\?.*)?$/, { timeout: 10_000 });

      await page.getByLabel("Buscar conductores").fill(license);
      const row = page.getByRole("row").filter({ hasText: license });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByText("En ruta")).toBeVisible();

      const href = await row
        .getByRole("link", { name: `Editar conductor ${license}` })
        .getAttribute("href");
      driverId = Number(href?.split("/").pop());

      // El serializer actual no expone user_full_name/email/username derivados;
      // se verifica el vínculo con el usuario sembrado vía la FK `user`.
      const created = (await api.get("drivers")) as {
        results: { id: number; user: number }[];
      };
      const createdDriver = created.results.find((d) => d.id === driverId);
      expect(createdDriver?.user).toBe(userId);
    } finally {
      if (driverId) await api.remove("drivers", driverId);
      await api.remove("auth/users", userId);
    }
  });

  test("formulario vacío muestra errores de validación y no crea nada", async ({ page }) => {
    await page.goto("/drivers/new");

    await page.getByRole("button", { name: "Crear conductor" }).click();

    // license_number, phone muestran "Requerido"; el campo "user" vacío
    // (z.coerce.number sobre undefined) cae en el mensaje por defecto de zod, no "Requerido".
    await expect(page.getByText("Requerido").first()).toBeVisible();
    await expect(page.getByText("Requerido")).toHaveCount(2);
    await expect(page).toHaveURL(/\/drivers\/new/);
  });

  test("editar un conductor sembrado y ver el cambio en la lista", async ({ page, api }) => {
    const userId = await seedUser(api, "Editar");
    const originalLicense = unique("LIC-Editar-Original");
    const updatedLicense = unique("LIC-Editar-Actualizado");
    const driverId = await api.seed("drivers", {
      user: userId,
      license_number: originalLicense,
      phone: "+57 300 3333333",
      status: "available",
    });

    try {
      await page.goto(`/drivers/${driverId}`);
      await expect(page.getByLabel("ID de usuario")).toHaveValue(String(userId));
      await expect(page.getByLabel("Número de licencia")).toHaveValue(originalLicense);

      await page.getByLabel("Número de licencia").fill(updatedLicense);
      await page.getByRole("button", { name: "Actualizar" }).click();
      await page.waitForURL(/\/drivers\/?(\?.*)?$/, { timeout: 10_000 });

      await page.getByLabel("Buscar conductores").fill(updatedLicense);
      await expect(
        page.getByRole("row").filter({ hasText: updatedLicense })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove("drivers", driverId);
      await api.remove("auth/users", userId);
    }
  });

  test("eliminar un conductor sembrado lo quita de la lista (soft delete)", async ({ page, api }) => {
    const userId = await seedUser(api, "Eliminar");
    const license = unique("LIC-Eliminar");
    const driverId = await api.seed("drivers", {
      user: userId,
      license_number: license,
      phone: "+57 300 4444444",
      status: "available",
    });

    try {
      await page.goto("/drivers");
      await page.getByLabel("Buscar conductores").fill(license);

      const row = page.getByRole("row").filter({ hasText: license });
      await expect(row).toBeVisible({ timeout: 10_000 });

      await row.getByRole("button", { name: `Eliminar conductor ${license}` }).click();
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();

      // El diálogo se cierra y la búsqueda se reinicia tras invalidar la query.
      await expect(page.getByRole("button", { name: "Eliminar", exact: true })).not.toBeVisible({
        timeout: 10_000,
      });
      await page.getByLabel("Buscar conductores").fill(license);

      await expect(page.getByText("No hay conductores registrados.")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: license })).not.toBeVisible();
    } finally {
      await api.remove("drivers", driverId);
      await api.remove("auth/users", userId);
    }
  });

  test("la búsqueda filtra por licencia entre varios conductores sembrados", async ({ page, api }) => {
    const suffix = unique("Filtro");
    const licenseA = `${suffix}-Norte`;
    const licenseB = `${suffix}-Sur`;
    const licenseC = `${suffix}-Otro`;

    const userA = await seedUser(api, "Filtro-A");
    const userB = await seedUser(api, "Filtro-B");
    const userC = await seedUser(api, "Filtro-C");

    const idA = await api.seed("drivers", { user: userA, license_number: licenseA, phone: "+57 300 5550001", status: "available" });
    const idB = await api.seed("drivers", { user: userB, license_number: licenseB, phone: "+57 300 5550002", status: "available" });
    const idC = await api.seed("drivers", { user: userC, license_number: licenseC, phone: "+57 300 5550003", status: "available" });

    try {
      await page.goto("/drivers");

      await page.getByLabel("Buscar conductores").fill(suffix);
      await expect(page.getByRole("row").filter({ hasText: licenseA })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: licenseB })).toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: licenseC })).toBeVisible();

      await page.getByLabel("Buscar conductores").fill(licenseA);
      await expect(page.getByRole("row").filter({ hasText: licenseA })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: licenseB })).not.toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: licenseC })).not.toBeVisible();
    } finally {
      await api.remove("drivers", idA);
      await api.remove("drivers", idB);
      await api.remove("drivers", idC);
      await api.remove("auth/users", userA);
      await api.remove("auth/users", userB);
      await api.remove("auth/users", userC);
    }
  });
});
