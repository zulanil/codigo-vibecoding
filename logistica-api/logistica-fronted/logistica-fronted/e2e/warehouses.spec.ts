import { test, expect } from "./fixtures";

function unique(label: string): string {
  return `E2E-${label}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

const basePayload = {
  address: "Av. Siempre Viva 123",
  city: "Springfield",
  country: "Colombia",
  capacity_kg: "1000.00",
};

test.describe("Warehouses CRUD", () => {
  test("la lista renderiza un registro sembrado vía API", async ({ page, api }) => {
    const name = unique("Lista");
    const id = await api.seed("warehouses", { ...basePayload, name });

    try {
      await page.goto("/warehouses");
      await page.getByLabel("Buscar almacenes").fill(name);

      const row = page.getByRole("row").filter({ hasText: name });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByRole("cell", { name: basePayload.city })).toBeVisible();
      await expect(row.getByRole("cell", { name: basePayload.country })).toBeVisible();
    } finally {
      await api.remove("warehouses", id);
    }
  });

  test("crear un almacén desde el formulario y verlo en la lista", async ({ page, api }) => {
    const name = unique("Crear");
    let id: number | undefined;

    try {
      await page.goto("/warehouses");
      await page.getByRole("link", { name: "Nuevo Almacén" }).click();
      await page.waitForURL("**/warehouses/new");

      await page.getByLabel("Nombre").fill(name);
      await page.getByLabel("Dirección").fill(basePayload.address);
      await page.getByLabel("Ciudad").fill(basePayload.city);
      await page.getByLabel("País").fill(basePayload.country);
      await page.getByLabel("Capacidad (kg)").fill("2500");

      await page.getByRole("button", { name: "Crear almacén" }).click();
      await page.waitForURL(/\/warehouses\/?(\?.*)?$/, { timeout: 10_000 });

      await page.getByLabel("Buscar almacenes").fill(name);
      const row = page.getByRole("row").filter({ hasText: name });
      await expect(row).toBeVisible({ timeout: 10_000 });

      const href = await row.getByRole("link", { name: `Editar ${name}` }).getAttribute("href");
      id = Number(href?.split("/").pop());
    } finally {
      if (id) await api.remove("warehouses", id);
    }
  });

  test("formulario vacío muestra errores de validación y no crea nada", async ({ page }) => {
    await page.goto("/warehouses/new");

    await page.getByRole("button", { name: "Crear almacén" }).click();

    await expect(page.getByText("Requerido").first()).toBeVisible();
    await expect(page.getByText("Requerido")).toHaveCount(5);
    await expect(page).toHaveURL(/\/warehouses\/new/);
  });

  test("editar un almacén sembrado y ver el cambio en la lista", async ({ page, api }) => {
    const originalName = unique("Editar-Original");
    const updatedName = unique("Editar-Actualizado");
    const id = await api.seed("warehouses", { ...basePayload, name: originalName });

    try {
      await page.goto(`/warehouses/${id}`);
      await expect(page.getByLabel("Nombre")).toHaveValue(originalName);

      await page.getByLabel("Nombre").fill(updatedName);
      await page.getByRole("button", { name: "Actualizar" }).click();
      await page.waitForURL(/\/warehouses\/?(\?.*)?$/, { timeout: 10_000 });

      await page.getByLabel("Buscar almacenes").fill(updatedName);
      await expect(
        page.getByRole("row").filter({ hasText: updatedName })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove("warehouses", id);
    }
  });

  test("eliminar un almacén sembrado lo quita de la lista (soft delete)", async ({ page, api }) => {
    const name = unique("Eliminar");
    const id = await api.seed("warehouses", { ...basePayload, name });

    try {
      await page.goto("/warehouses");
      await page.getByLabel("Buscar almacenes").fill(name);

      const row = page.getByRole("row").filter({ hasText: name });
      await expect(row).toBeVisible({ timeout: 10_000 });

      await row.getByRole("button", { name: `Eliminar ${name}` }).click();
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();

      // El diálogo se cierra y la búsqueda se reinicia tras invalidar la query.
      await expect(page.getByRole("button", { name: "Eliminar", exact: true })).not.toBeVisible({
        timeout: 10_000,
      });
      await page.getByLabel("Buscar almacenes").fill(name);

      await expect(page.getByText("No hay almacenes registrados.")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: name })).not.toBeVisible();
    } finally {
      await api.remove("warehouses", id);
    }
  });

  test("la búsqueda filtra por nombre entre varios registros sembrados", async ({ page, api }) => {
    const suffix = unique("Filtro");
    const nameA = `${suffix}-Norte`;
    const nameB = `${suffix}-Sur`;
    const nameC = `${suffix}-Otro`;

    const idA = await api.seed("warehouses", { ...basePayload, name: nameA });
    const idB = await api.seed("warehouses", { ...basePayload, name: nameB });
    const idC = await api.seed("warehouses", { ...basePayload, name: nameC });

    try {
      await page.goto("/warehouses");

      // Sin filtro específico, los 3 registros sembrados aparecen
      await page.getByLabel("Buscar almacenes").fill(suffix);
      await expect(page.getByRole("row").filter({ hasText: nameA })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: nameB })).toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: nameC })).toBeVisible();

      // Filtrando por el nombre completo de uno solo, los otros desaparecen
      await page.getByLabel("Buscar almacenes").fill(nameA);
      await expect(page.getByRole("row").filter({ hasText: nameA })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: nameB })).not.toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: nameC })).not.toBeVisible();
    } finally {
      await api.remove("warehouses", idA);
      await api.remove("warehouses", idB);
      await api.remove("warehouses", idC);
    }
  });
});
