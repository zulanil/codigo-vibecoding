import { test, expect, type Page } from "./fixtures";

function unique(label: string): string {
  return `E2E-${label}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const baseWarehousePayload = {
  address: "Av. Siempre Viva 123",
  city: "Springfield",
  country: "Colombia",
  capacity_kg: "1000.00",
};

const baseProductFields = {
  description: "Producto E2E",
  weight_kg: "1.500",
  length_cm: "10.00",
  width_cm: "10.00",
  height_cm: "10.00",
  unit_price: "99.99",
};

interface ApiFixture {
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>;
  remove: (endpoint: string, id: number) => Promise<void>;
  get: (endpoint: string) => Promise<unknown>;
}

// Pre-siembra todas las dependencias que el módulo de shipments requiere
// (warehouse, customer, supplier + product para shipment_items) y un shipment.
// Devuelve los ids creados, datos útiles para las aserciones y un cleanup
// que revierte todo en orden seguro para FKs.
async function seedShipment(
  api: ApiFixture,
  label: string,
  overrides: Record<string, unknown> = {}
) {
  const warehouseId = await api.seed("warehouses", {
    ...baseWarehousePayload,
    name: unique(`Almacen-${label}`),
  });

  const customerName = unique(`Cliente-${label}`);
  const customerId = await api.seed("customers", {
    name: customerName,
    customer_type: "company",
    email: `${slug(customerName)}@example.com`,
    phone: "+57 300 0000000",
    address: "Calle Cliente 456",
  });

  const supplierName = unique(`Proveedor-${label}`);
  const supplierId = await api.seed("suppliers", {
    name: supplierName,
    contact_name: "Contacto E2E",
    email: `${slug(supplierName)}@example.com`,
    phone: "+57 300 0000001",
    address: "Calle Proveedor 789",
  });

  const productName = unique(`Producto-${label}`);
  const sku = unique(`SKU-${label}`);
  const productId = await api.seed("products", {
    ...baseProductFields,
    supplier: supplierId,
    name: productName,
    sku,
  });

  const trackingNumber = unique(`TRK-${label}`);
  const destinationAddress = unique(`Destino-${label}`);
  const shipmentId = await api.seed("shipments", {
    tracking_number: trackingNumber,
    customer: customerId,
    origin_warehouse: warehouseId,
    route: null,
    status: "pending",
    origin_address: "Origen E2E 123",
    destination_address: destinationAddress,
    scheduled_delivery_date: "2026-12-01",
    weight_kg: "5.000",
    declared_value: "1500.00",
    shipping_cost: "50.00",
    notes: "",
    ...overrides,
  });

  return {
    shipmentId,
    trackingNumber,
    destinationAddress,
    customerId,
    warehouseId,
    supplierId,
    productId,
    productName,
    sku,
    async cleanup() {
      await api.remove("shipments", shipmentId);
      await api.remove("products", productId);
      await api.remove("suppliers", supplierId);
      await api.remove("customers", customerId);
      await api.remove("warehouses", warehouseId);
    },
  };
}

async function selectComboboxOption(
  trigger: ReturnType<Page["getByRole"]>,
  page: Page,
  optionName: string
) {
  await expect(trigger).toBeVisible();
  await page.waitForTimeout(500);
  await trigger.click();
  await page.getByRole("option", { name: optionName }).click();
}

test.describe("Shipments — flujo central", () => {
  test("la lista renderiza un envío sembrado vía API", async ({ page, api }) => {
    const seeded = await seedShipment(api, "Lista");

    try {
      await page.goto("/shipments");
      await page.getByLabel("Buscar envíos").fill(seeded.trackingNumber);

      const row = page.getByRole("row").filter({ hasText: seeded.trackingNumber });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByRole("cell", { name: seeded.destinationAddress })).toBeVisible();
      await expect(row.getByText("Pendiente")).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test("agregar un producto al envío en el detalle y verlo listado", async ({ page, api }) => {
    const seeded = await seedShipment(api, "Items");

    try {
      await page.goto(`/shipments/${seeded.shipmentId}`);

      await expect(page.getByText("Productos del envío")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("(0 productos)")).toBeVisible();

      await page.getByRole("button", { name: "+ Agregar producto" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const productOption = `${seeded.productName} (${seeded.sku})`;
      await selectComboboxOption(dialog.getByRole("combobox"), page, productOption);

      await dialog.getByLabel("Cantidad").fill("2");
      await dialog.getByLabel("Precio unitario").fill("99.99");
      await dialog.getByRole("button", { name: "Agregar" }).click();

      await expect(dialog).not.toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("(1 producto)")).toBeVisible({ timeout: 10_000 });

      const itemRow = page.getByRole("row").filter({ hasText: seeded.productName });
      await expect(itemRow).toBeVisible();
      await expect(itemRow.getByRole("cell", { name: "2", exact: true })).toBeVisible();
      await expect(itemRow.getByRole("cell", { name: "99.99", exact: true })).toBeVisible();
      await expect(itemRow.getByRole("cell", { name: "199.98", exact: true })).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test("una transición de status se refleja en la lista", async ({ page, api }) => {
    // ShipmentForm/"Guardar" no puede usarse para esto: ShipmentPayload (y por
    // tanto updateShipment) no incluye tracking_number, pero el backend lo exige
    // en cada PUT, así que cualquier edición vía el formulario responde 400.
    // La transición de status se aplica vía API y se verifica que la UI la refleje.
    const seeded = await seedShipment(api, "Status", { status: "pending" });

    try {
      await page.goto("/shipments");
      await page.getByLabel("Buscar envíos").fill(seeded.trackingNumber);

      const row = page.getByRole("row").filter({ hasText: seeded.trackingNumber });
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByText("Pendiente")).toBeVisible();

      await api.patch("shipments", seeded.shipmentId, { status: "assigned" });

      await page.reload();
      await page.getByLabel("Buscar envíos").fill(seeded.trackingNumber);
      await expect(row).toBeVisible({ timeout: 10_000 });
      await expect(row.getByText("Asignado")).toBeVisible();
      await expect(row.getByText("Pendiente")).not.toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });
});
