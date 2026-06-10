import { test, expect, type Page } from "./fixtures";

function unique(label: string): string {
  return `E2E-${label}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function supplierPayload(name: string) {
  return {
    name,
    contact_name: "Contacto E2E",
    email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
    phone: "+57 300 0000000",
    address: "Calle Falsa 123",
  };
}

const baseProductFields = {
  description: "Producto E2E",
  weight_kg: "1.500",
  length_cm: "10.00",
  width_cm: "10.00",
  height_cm: "10.00",
  unit_price: "99.99",
};

async function selectSupplier(page: Page, supplierName: string) {
  const trigger = page.getByRole("combobox");
  await expect(trigger).toBeVisible();
  await page.waitForTimeout(500);
  await trigger.click();
  await page.getByRole("option", { name: supplierName }).click();
}

test.describe("Products CRUD", () => {
  test("la lista renderiza un producto sembrado vía API", async ({ page, api }) => {
    const supplierName = unique("Proveedor-Lista");
    const supplierId = await api.seed("suppliers", supplierPayload(supplierName));
    const sku = unique("SKU-Lista");
    const name = unique("Producto-Lista");
    const productId = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name,
      sku,
    });

    try {
      await page.goto("/products");
      await page.getByLabel("Buscar productos").fill(sku);

      const row = page.getByRole("row").filter({ hasText: sku });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByRole("cell", { name: supplierName })).toBeVisible();
    } finally {
      await api.remove("products", productId);
      await api.remove("suppliers", supplierId);
    }
  });

  test("crear un producto desde el formulario, eligiendo proveedor", async ({ page, api }) => {
    const supplierName = unique("Proveedor-Crear");
    const supplierId = await api.seed("suppliers", supplierPayload(supplierName));
    const name = unique("Producto-Crear");
    const sku = unique("SKU-Crear");
    let productId: number | undefined;

    try {
      await page.goto("/products/new");

      await selectSupplier(page, supplierName);

      await page.getByLabel("Nombre").fill(name);
      await page.getByLabel("SKU").fill(sku);
      await page.getByLabel("Peso (kg)").fill(baseProductFields.weight_kg);
      await page.getByLabel("Precio unitario").fill(baseProductFields.unit_price);
      await page.getByLabel("Largo (cm)").fill(baseProductFields.length_cm);
      await page.getByLabel("Ancho (cm)").fill(baseProductFields.width_cm);
      await page.getByLabel("Alto (cm)").fill(baseProductFields.height_cm);

      await page.getByRole("button", { name: "Crear producto" }).click();
      await page.waitForURL(/\/products\/?(\?.*)?$/, { timeout: 10_000 });

      await page.getByLabel("Buscar productos").fill(sku);
      const row = page.getByRole("row").filter({ hasText: sku });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByRole("cell", { name: supplierName })).toBeVisible();

      const href = await row.getByRole("link", { name: `Editar ${name}` }).getAttribute("href");
      productId = Number(href?.split("/").pop());
    } finally {
      if (productId) await api.remove("products", productId);
      await api.remove("suppliers", supplierId);
    }
  });

  test("formulario vacío muestra errores de validación y no crea nada", async ({ page }) => {
    await page.goto("/products/new");

    await page.getByRole("button", { name: "Crear producto" }).click();

    // supplier, name, sku, weight_kg, length_cm, width_cm, height_cm, unit_price
    await expect(page.getByText("Requerido").first()).toBeVisible();
    await expect(page.getByText("Requerido")).toHaveCount(8);
    await expect(page).toHaveURL(/\/products\/new/);
  });

  test("editar un producto sembrado y ver el cambio en la lista", async ({ page, api }) => {
    const supplierName = unique("Proveedor-Editar");
    const supplierId = await api.seed("suppliers", supplierPayload(supplierName));
    const originalName = unique("Producto-Editar-Original");
    const updatedName = unique("Producto-Editar-Actualizado");
    const sku = unique("SKU-Editar");
    const productId = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name: originalName,
      sku,
    });

    try {
      await page.goto(`/products/${productId}`);
      await expect(page.getByLabel("Nombre")).toHaveValue(originalName);

      await page.getByLabel("Nombre").fill(updatedName);
      await page.getByRole("button", { name: "Actualizar" }).click();
      await page.waitForURL(/\/products\/?(\?.*)?$/, { timeout: 10_000 });

      await page.getByLabel("Buscar productos").fill(updatedName);
      await expect(
        page.getByRole("row").filter({ hasText: updatedName })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove("products", productId);
      await api.remove("suppliers", supplierId);
    }
  });

  test("eliminar un producto sembrado lo quita de la lista (soft delete)", async ({ page, api }) => {
    const supplierName = unique("Proveedor-Eliminar");
    const supplierId = await api.seed("suppliers", supplierPayload(supplierName));
    const name = unique("Producto-Eliminar");
    const sku = unique("SKU-Eliminar");
    const productId = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name,
      sku,
    });

    try {
      await page.goto("/products");
      await page.getByLabel("Buscar productos").fill(sku);

      const row = page.getByRole("row").filter({ hasText: sku });
      await expect(row).toBeVisible({ timeout: 10_000 });

      await row.getByRole("button", { name: `Eliminar ${name}` }).click();
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();

      // El diálogo se cierra y la búsqueda se reinicia tras invalidar la query.
      await expect(page.getByRole("button", { name: "Eliminar", exact: true })).not.toBeVisible({
        timeout: 10_000,
      });
      await page.getByLabel("Buscar productos").fill(sku);

      await expect(page.getByText("No hay productos registrados.")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: sku })).not.toBeVisible();
    } finally {
      await api.remove("products", productId);
      await api.remove("suppliers", supplierId);
    }
  });

  test("la búsqueda filtra por SKU entre varios productos sembrados", async ({ page, api }) => {
    const supplierName = unique("Proveedor-Filtro");
    const supplierId = await api.seed("suppliers", supplierPayload(supplierName));
    const suffix = unique("Filtro");
    const skuA = `${suffix}-Norte`;
    const skuB = `${suffix}-Sur`;
    const skuC = `${suffix}-Otro`;

    const idA = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name: `Producto ${skuA}`,
      sku: skuA,
    });
    const idB = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name: `Producto ${skuB}`,
      sku: skuB,
    });
    const idC = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name: `Producto ${skuC}`,
      sku: skuC,
    });

    try {
      await page.goto("/products");

      await page.getByLabel("Buscar productos").fill(suffix);
      await expect(page.getByRole("row").filter({ hasText: skuA })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: skuB })).toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: skuC })).toBeVisible();

      await page.getByLabel("Buscar productos").fill(skuA);
      await expect(page.getByRole("row").filter({ hasText: skuA })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("row").filter({ hasText: skuB })).not.toBeVisible();
      await expect(page.getByRole("row").filter({ hasText: skuC })).not.toBeVisible();
    } finally {
      await api.remove("products", idA);
      await api.remove("products", idB);
      await api.remove("products", idC);
      await api.remove("suppliers", supplierId);
    }
  });

  test("SKU duplicado muestra el error del backend en el formulario", async ({ page, api }) => {
    const supplierName = unique("Proveedor-SKU");
    const supplierId = await api.seed("suppliers", supplierPayload(supplierName));
    const existingSku = unique("SKU-Duplicado");
    const existingProductId = await api.seed("products", {
      ...baseProductFields,
      supplier: supplierId,
      name: unique("Producto-SKU-Original"),
      sku: existingSku,
    });

    try {
      await page.goto("/products/new");

      await selectSupplier(page, supplierName);

      const skuInput = page.getByLabel("SKU");
      await page.getByLabel("Nombre").fill(unique("Producto-SKU-Duplicado"));
      await skuInput.fill(existingSku);
      await page.getByLabel("Peso (kg)").fill(baseProductFields.weight_kg);
      await page.getByLabel("Precio unitario").fill(baseProductFields.unit_price);
      await page.getByLabel("Largo (cm)").fill(baseProductFields.length_cm);
      await page.getByLabel("Ancho (cm)").fill(baseProductFields.width_cm);
      await page.getByLabel("Alto (cm)").fill(baseProductFields.height_cm);

      await page.getByRole("button", { name: "Crear producto" }).click();

      await expect(
        page.getByText("product with this sku already exists.")
      ).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/products\/new/);
    } finally {
      await api.remove("products", existingProductId);
      await api.remove("suppliers", supplierId);
    }
  });
});
